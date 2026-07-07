const PAYSTACK_BASE = "https://api.paystack.co";

import { ghsPesewasForUsdCents } from "./paystackFx";

function secretKey(): string {
  const key = (process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET)?.trim();
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

async function paystackRequest<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack request failed (${res.status})`);
  }
  return json.data as T;
}

export interface PaystackInitResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(params: {
  email: string;
  /** List price in USD cents — converted to GHS pesewas for Paystack. */
  usdCents: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<PaystackInitResult & { ghsPesewas: number; ghsLabel: string; usdLabel: string }> {
  const { ghsPesewas, ghsLabel, usdLabel } = await ghsPesewasForUsdCents(params.usdCents);

  const result = await paystackRequest<PaystackInitResult>("/transaction/initialize", {
    email: params.email,
    amount: ghsPesewas,
    currency: "GHS",
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: {
      ...params.metadata,
      usdCents: String(params.usdCents),
      ghsPesewas: String(ghsPesewas),
    },
  });

  return { ...result, ghsPesewas, ghsLabel, usdLabel };
}

export async function verifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}> {
  const data = await paystackRequest<{
    status: string;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);
  return data;
}

export function verifyPaystackWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false;
  const crypto = require("crypto") as typeof import("crypto");
  const hash = crypto.createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  return hash === signature;
}
