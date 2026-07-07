export enum BillingProvider {
  PAYSTACK = "PAYSTACK",
  STRIPE = "STRIPE",
}

export enum BillingInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELLED = "cancelled",
}

export enum InvoiceStatus {
  OPEN = "open",
  PAID = "paid",
  VOID = "void",
}

/** Amounts in USD cents for Paystack */
export const PRO_AMOUNTS_USD_CENTS: Record<BillingInterval, number> = {
  [BillingInterval.MONTHLY]: 900,
  [BillingInterval.YEARLY]: 8400,
};

export function intervalDays(interval: BillingInterval): number {
  return interval === BillingInterval.YEARLY ? 365 : 30;
}
