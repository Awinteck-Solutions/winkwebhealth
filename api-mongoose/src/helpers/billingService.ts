import { randomBytes } from "crypto";
import mongoose from "mongoose";
import User from "../Features/auth/schema/user.schema";
import Subscription from "../Features/billing/schema/subscription.schema";
import Invoice from "../Features/billing/schema/invoice.schema";
import {
  BillingInterval,
  BillingProvider,
  PRO_AMOUNTS_USD_CENTS,
  SubscriptionStatus,
  InvoiceStatus,
  intervalDays,
} from "../enums/billing.enum";
import { Plan } from "../enums/plan.enum";
import { initializeTransaction } from "./paystack";
import { formatUsd, formatGhs, ghsPesewasForUsdCents } from "./paystackFx";
import { sendInvoiceDueEmail, sendPaymentReceiptEmail } from "./mailer";

const RENEWAL_NOTICE_DAYS = 3;

export async function generateInvoiceNumber(): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `WWH-${date}-${suffix}`;
}

export function generateReceiptToken(): string {
  return randomBytes(24).toString("hex");
}

export function formatUsdAmount(cents: number): string {
  return formatUsd(cents);
}

export async function getActiveSubscription(userId: string) {
  return Subscription.findOne({ userId, status: SubscriptionStatus.ACTIVE }).sort({ createdAt: -1 });
}

export async function activateProPlan(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { plan: Plan.PRO });
}

export async function deactivateProPlan(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { plan: Plan.FREE });
}

export async function createCheckout(params: {
  userId: string;
  email: string;
  provider: BillingProvider;
  interval: BillingInterval;
}): Promise<{ url: string; reference: string }> {
  if (params.provider !== BillingProvider.PAYSTACK) {
    throw new Error("Only Paystack checkout is available. Stripe is not configured.");
  }

  const amountCents = PRO_AMOUNTS_USD_CENTS[params.interval];
  const pricing = await ghsPesewasForUsdCents(amountCents);
  const reference = `wwh_${params.userId}_${Date.now()}`;
  const webUrl = (process.env.WEB_URL || "http://localhost:8080").replace(/\/$/, "");

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + intervalDays(params.interval));

  const invoiceNumber = await generateInvoiceNumber();
  const receiptToken = generateReceiptToken();

  const invoice = await Invoice.create({
    userId: params.userId,
    invoiceNumber,
    amountCents,
    currency: "USD",
    chargeAmountMinor: pricing.ghsPesewas,
    chargeCurrency: "GHS",
    interval: params.interval,
    status: InvoiceStatus.OPEN,
    periodStart: now,
    periodEnd,
    providerReference: reference,
    receiptToken,
  });

  const init = await initializeTransaction({
    email: params.email,
    usdCents: amountCents,
    reference,
    callbackUrl: `${webUrl}/dashboard/billing?payment=success&ref=${reference}`,
    metadata: {
      userId: params.userId,
      invoiceId: String(invoice._id),
      interval: params.interval,
      type: "subscription_checkout",
    },
  });

  invoice.paymentUrl = init.authorization_url;
  await invoice.save();

  return { url: init.authorization_url, reference };
}

export async function completePaystackPayment(reference: string): Promise<void> {
  const { verifyTransaction } = await import("./paystack");
  const tx = await verifyTransaction(reference);
  if (tx.status !== "success") return;

  const invoice = await Invoice.findOne({ providerReference: reference, status: InvoiceStatus.OPEN });
  if (!invoice) return;

  const userId = String(invoice.userId);
  const interval = invoice.interval as BillingInterval;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + intervalDays(interval));

  invoice.status = InvoiceStatus.PAID;
  invoice.paidAt = now;
  await invoice.save();

  let subscription = await Subscription.findOne({ userId, status: SubscriptionStatus.ACTIVE });
  if (subscription) {
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = periodEnd;
    subscription.interval = interval;
    subscription.provider = BillingProvider.PAYSTACK;
    await subscription.save();
  } else {
    subscription = await Subscription.create({
      userId,
      provider: BillingProvider.PAYSTACK,
      interval,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });
  }

  invoice.subscriptionId = subscription._id as mongoose.Types.ObjectId;
  await invoice.save();

  await activateProPlan(userId);

  const user = await User.findById(userId);
  if (user?.email) {
    const webUrl = (process.env.WEB_URL || "http://localhost:8080").replace(/\/$/, "");
    await sendPaymentReceiptEmail({
      to: user.email,
      name: user.firstname || user.email,
      invoiceNumber: invoice.invoiceNumber,
      amountLabel: invoice.chargeAmountMinor
        ? `${formatUsdAmount(invoice.amountCents)} (paid ${formatGhs(invoice.chargeAmountMinor)})`
        : formatUsdAmount(invoice.amountCents),
      periodEnd: periodEnd.toLocaleDateString("en-US", { dateStyle: "medium" }),
      receiptUrl: `${webUrl}/receipt/${invoice.receiptToken}`,
    });
  }
}

export async function processRenewalInvoices(): Promise<number> {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + RENEWAL_NOTICE_DAYS);

  const subs = await Subscription.find({
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: { $lte: threshold },
    cancelAtPeriodEnd: { $ne: true },
  });

  let created = 0;
  for (const sub of subs) {
    const userId = String(sub.userId);
    const existingOpen = await Invoice.findOne({
      userId,
      status: InvoiceStatus.OPEN,
      periodStart: { $gte: sub.currentPeriodStart },
    });
    if (existingOpen) continue;

    const user = await User.findById(userId);
    if (!user?.email) continue;

    const interval = sub.interval as BillingInterval;
    const amountCents = PRO_AMOUNTS_USD_CENTS[interval];
    const pricing = await ghsPesewasForUsdCents(amountCents);
    const reference = `wwh_renew_${userId}_${Date.now()}`;
    const webUrl = (process.env.WEB_URL || "http://localhost:8080").replace(/\/$/, "");
    const invoiceNumber = await generateInvoiceNumber();
    const receiptToken = generateReceiptToken();

    const invoice = await Invoice.create({
      userId,
      subscriptionId: sub._id,
      invoiceNumber,
      amountCents,
      currency: "USD",
      chargeAmountMinor: pricing.ghsPesewas,
      chargeCurrency: "GHS",
      interval,
      status: InvoiceStatus.OPEN,
      periodStart: sub.currentPeriodEnd,
      periodEnd: new Date(new Date(sub.currentPeriodEnd).getTime() + intervalDays(interval) * 86400000),
      providerReference: reference,
      receiptToken,
    });

    const init = await initializeTransaction({
      email: user.email,
      usdCents: amountCents,
      reference,
      callbackUrl: `${webUrl}/dashboard/billing?payment=renew&ref=${reference}`,
      metadata: {
        userId,
        invoiceId: String(invoice._id),
        interval,
        type: "subscription_renewal",
      },
    });

    invoice.paymentUrl = init.authorization_url;
    await invoice.save();

    await sendInvoiceDueEmail({
      to: user.email,
      name: user.firstname || user.email,
      invoiceNumber: invoice.invoiceNumber,
      amountLabel: `${formatUsdAmount(amountCents)} (${pricing.ghsLabel} via Paystack)`,
      dueDate: sub.currentPeriodEnd.toLocaleDateString("en-US", { dateStyle: "medium" }),
      paymentUrl: init.authorization_url,
    });

    sub.status = SubscriptionStatus.PAST_DUE;
    await sub.save();
    created++;
  }
  return created;
}

export async function listUserInvoices(userId: string) {
  return Invoice.find({ userId }).sort({ createdAt: -1 }).limit(24).lean();
}

export async function getReceiptByToken(token: string) {
  const invoice = await Invoice.findOne({ receiptToken: token, status: InvoiceStatus.PAID }).lean();
  if (!invoice) return null;
  const user = await User.findById(invoice.userId).select("email firstname lastname").lean();
  return { invoice, user };
}

export async function getPublicPricing() {
  const monthly = await ghsPesewasForUsdCents(PRO_AMOUNTS_USD_CENTS[BillingInterval.MONTHLY]);
  const yearly = await ghsPesewasForUsdCents(PRO_AMOUNTS_USD_CENTS[BillingInterval.YEARLY]);
  return {
    usdToGhsRate: monthly.rate,
    rateSource: monthly.rateSource,
    rateFetchedAt: monthly.rateFetchedAt,
    monthly: {
      usdCents: monthly.usdCents,
      usdLabel: monthly.usdLabel,
      ghsPesewas: monthly.ghsPesewas,
      ghsLabel: monthly.ghsLabel,
    },
    yearly: {
      usdCents: yearly.usdCents,
      usdLabel: yearly.usdLabel,
      ghsPesewas: yearly.ghsPesewas,
      ghsLabel: yearly.ghsLabel,
    },
  };
}

export async function cancelSubscription(userId: string): Promise<{ currentPeriodEnd: Date }> {
  const sub = await Subscription.findOne({ userId, status: SubscriptionStatus.ACTIVE });
  if (!sub) throw new Error("No active subscription to cancel");
  if (sub.cancelAtPeriodEnd) {
    return { currentPeriodEnd: sub.currentPeriodEnd };
  }
  sub.cancelAtPeriodEnd = true;
  await sub.save();
  return { currentPeriodEnd: sub.currentPeriodEnd };
}

export async function processExpiredSubscriptions(): Promise<number> {
  const now = new Date();
  const subs = await Subscription.find({
    status: SubscriptionStatus.ACTIVE,
    cancelAtPeriodEnd: true,
    currentPeriodEnd: { $lte: now },
  });

  let processed = 0;
  for (const sub of subs) {
    const userId = String(sub.userId);
    await deactivateProPlan(userId);
    sub.status = SubscriptionStatus.CANCELLED;
    await sub.save();
    processed++;
  }
  return processed;
}
