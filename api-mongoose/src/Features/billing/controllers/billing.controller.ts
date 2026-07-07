import { Request, Response } from "express";
import Stripe = require("stripe");
import User from "../../auth/schema/user.schema";
import { getWorkspaceOwnerId, getTeamRole } from "../../../helpers/requestUser";
import { PLAN_LIMITS, Plan } from "../../../enums/plan.enum";
import { BillingInterval, BillingProvider } from "../../../enums/billing.enum";
import { getAvailableProviders, isStripeConfigured } from "../../../helpers/billingConfig";
import {
  createCheckout,
  getActiveSubscription,
  listUserInvoices,
  getReceiptByToken,
  completePaystackPayment,
  getPublicPricing,
  cancelSubscription,
} from "../../../helpers/billingService";

const stripe = isStripeConfigured()
  ? new Stripe(process.env.STRIPE_SECRET_KEY || "")
  : null;

export class BillingController {
  static async getPlan(req: Request, res: Response) {
    try {
      const ownerId = getWorkspaceOwnerId(req);
      if (!ownerId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const user = await User.findById(ownerId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const plan = (user.plan as Plan) || Plan.FREE;
      const subscription = await getActiveSubscription(ownerId);
      const invoices = await listUserInvoices(ownerId);
      const pricing = await getPublicPricing();

      return res.status(200).json({
        success: true,
        data: {
          plan,
          limits: PLAN_LIMITS[plan],
          stripeCustomerId: user.stripeCustomerId,
          teamRole: getTeamRole(req),
          providers: getAvailableProviders(),
          pricing,
          subscription: subscription
            ? {
                provider: subscription.provider,
                interval: subscription.interval,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              }
            : null,
          invoices: invoices.map((inv) => ({
            id: String(inv._id),
            invoiceNumber: inv.invoiceNumber,
            amountCents: inv.amountCents,
            currency: inv.currency,
            chargeAmountMinor: inv.chargeAmountMinor,
            chargeCurrency: inv.chargeCurrency,
            status: inv.status,
            interval: inv.interval,
            periodStart: inv.periodStart,
            periodEnd: inv.periodEnd,
            paymentUrl: inv.paymentUrl,
            paidAt: inv.paidAt,
            receiptToken: inv.receiptToken,
          })),
        },
      });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async createCheckout(req: Request, res: Response) {
    try {
      if (getTeamRole(req) !== "OWNER") {
        return res.status(403).json({ success: false, message: "Only the workspace owner can manage billing" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const provider = (req.body?.provider as BillingProvider) || BillingProvider.PAYSTACK;
      const rawInterval = String(req.body?.interval || BillingInterval.MONTHLY).toLowerCase();
      const interval = rawInterval === BillingInterval.YEARLY ? BillingInterval.YEARLY : BillingInterval.MONTHLY;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      if (provider === BillingProvider.STRIPE) {
        if (!stripe || !isStripeConfigured()) {
          return res.status(400).json({ success: false, message: "Stripe is not configured yet" });
        }
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({ email: user.email });
          customerId = customer.id;
          user.stripeCustomerId = customerId;
          await user.save();
        }
        const priceId =
          interval === BillingInterval.YEARLY
            ? process.env.STRIPE_PRO_PRICE_YEARLY_ID || process.env.STRIPE_PRO_PRICE_ID
            : process.env.STRIPE_PRO_PRICE_ID;
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${process.env.WEB_URL}/dashboard/billing?success=true`,
          cancel_url: `${process.env.WEB_URL}/dashboard/billing?cancelled=true`,
          metadata: { userId: userId.toString(), interval },
        });
        return res.status(200).json({ success: true, data: { url: session.url } });
      }

      const checkout = await createCheckout({
        userId,
        email: user.email,
        provider: BillingProvider.PAYSTACK,
        interval,
      });
      return res.status(200).json({ success: true, data: checkout });
    } catch (error) {
      console.error("Checkout error:", error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create checkout session",
      });
    }
  }

  static async createPortal(req: Request, res: Response) {
    try {
      if (getTeamRole(req) !== "OWNER") {
        return res.status(403).json({ success: false, message: "Only the workspace owner can manage billing" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const user = await User.findById(userId);
      if (!user?.stripeCustomerId || !stripe) {
        return res.status(400).json({ success: false, message: "Stripe billing portal is not available" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.WEB_URL}/dashboard/billing`,
      });

      return res.status(200).json({ success: true, data: { url: session.url } });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to create portal session" });
    }
  }

  static async cancelSubscription(req: Request, res: Response) {
    try {
      if (getTeamRole(req) !== "OWNER") {
        return res.status(403).json({ success: false, message: "Only the workspace owner can manage billing" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const result = await cancelSubscription(userId);
      return res.status(200).json({
        success: true,
        message: "Subscription will cancel at the end of the current billing period",
        data: { currentPeriodEnd: result.currentPeriodEnd },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel subscription";
      return res.status(400).json({ success: false, message });
    }
  }

  static async getReceipt(req: Request, res: Response) {
    try {
      const token = req.params.token;
      const data = await getReceiptByToken(token);
      if (!data) return res.status(404).json({ success: false, message: "Receipt not found" });
      return res.status(200).json({ success: true, data });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async verifyPayment(req: Request, res: Response) {
    try {
      const reference = req.body?.reference as string;
      if (!reference) return res.status(400).json({ success: false, message: "Reference required" });
      await completePaystackPayment(reference);
      return res.status(200).json({ success: true, message: "Payment verified" });
    } catch (error) {
      console.error("Verify payment error:", error);
      return res.status(500).json({ success: false, message: "Payment verification failed" });
    }
  }

  static async stripeWebhook(req: Request, res: Response) {
    if (!stripe) return res.status(400).send("Stripe not configured");
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).send("Webhook Error");
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.metadata?.userId) {
            await User.findByIdAndUpdate(session.metadata.userId, { plan: Plan.PRO });
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const user = await User.findOne({ stripeCustomerId: customerId });
          if (user) {
            user.plan = subscription.status === "active" ? Plan.PRO : Plan.FREE;
            await user.save();
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          await User.findOneAndUpdate({ stripeCustomerId: customerId }, { plan: Plan.FREE });
          break;
        }
      }
      return res.json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      return res.status(500).json({ success: false });
    }
  }

  static async paystackWebhook(req: Request, res: Response) {
    try {
      const { verifyPaystackWebhookSignature } = await import("../../../helpers/paystack");
      const rawBody = req.body as Buffer;
      const signature = req.headers["x-paystack-signature"] as string | undefined;
      if (!verifyPaystackWebhookSignature(rawBody, signature)) {
        return res.status(400).send("Invalid signature");
      }
      const payload = JSON.parse(rawBody.toString()) as { event?: string; data?: { reference?: string } };
      if (payload.event === "charge.success" && payload.data?.reference) {
        await completePaystackPayment(payload.data.reference);
      }
      return res.json({ received: true });
    } catch (error) {
      console.error("Paystack webhook error:", error);
      return res.status(500).json({ success: false });
    }
  }
}
