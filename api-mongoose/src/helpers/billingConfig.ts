import { BillingProvider } from "../enums/billing.enum";

function isPlaceholder(value: string | undefined, patterns: RegExp[]): boolean {
  if (!value?.trim()) return true;
  return patterns.some((p) => p.test(value.trim()));
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRO_PRICE_ID;
  if (isPlaceholder(key, [/^sk_test_\.\.\.$/, /^sk_test_xxx/i, /^$/])) return false;
  if (isPlaceholder(price, [/^price_\.\.\.$/, /^price_xxx/i, /^$/])) return false;
  return key!.startsWith("sk_") && price!.startsWith("price_");
}

export function isPaystackConfigured(): boolean {
  const secret = (process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET)?.trim();
  if (!secret) return false;
  if (isPlaceholder(secret, [/^sk_test_xxx/i, /^sk_live_xxx/i])) return false;
  return secret.startsWith("sk_test_") || secret.startsWith("sk_live_");
}

export function getAvailableProviders(): { id: BillingProvider; enabled: boolean; label: string }[] {
  return [
    { id: BillingProvider.PAYSTACK, enabled: isPaystackConfigured(), label: "Paystack" },
    { id: BillingProvider.STRIPE, enabled: isStripeConfigured(), label: "Stripe" },
  ];
}
