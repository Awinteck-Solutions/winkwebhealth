/** Paystack charges in GHS — convert USD list prices using live FX rates. */

/** Sensible fallback when APIs are unavailable (~market rate Jul 2026). */
const DEFAULT_USD_TO_GHS = 11.42;
const CACHE_MS = 60 * 60 * 1000; // refresh hourly (providers update daily)
const MIN_GHS_PER_USD = 5;
const MAX_GHS_PER_USD = 25;

let cachedRate: { rate: number; fetchedAt: number; source: string } | null = null;

function staticUsdToGhsRate(): number {
  const raw = process.env.PAYSTACK_USD_TO_GHS_RATE?.trim();
  const rate = raw ? parseFloat(raw) : DEFAULT_USD_TO_GHS;
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_USD_TO_GHS;
}

function isValidRate(rate: unknown): rate is number {
  return typeof rate === "number" && rate >= MIN_GHS_PER_USD && rate <= MAX_GHS_PER_USD;
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(ms) });
}

/** ExchangeRate-API open endpoint — updated daily, no API key. */
async function fetchFromOpenErApi(): Promise<number | null> {
  try {
    const res = await fetchWithTimeout("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: string; rates?: { GHS?: number } };
    if (json.result !== "success") return null;
    const rate = json.rates?.GHS;
    return isValidRate(rate) ? rate : null;
  } catch {
    return null;
  }
}

/** jsDelivr mirror of fawazahmed0/currency-api — updated daily. */
async function fetchFromCurrencyApi(): Promise<number | null> {
  try {
    const res = await fetchWithTimeout(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { usd?: { ghs?: number } };
    const rate = json.usd?.ghs;
    return isValidRate(rate) ? rate : null;
  } catch {
    return null;
  }
}

/**
 * Fetch from multiple live sources; use median when more than one succeeds
 * so a single outlier does not skew Paystack charges.
 */
async function fetchLiveUsdToGhsRate(): Promise<{ rate: number; source: string } | null> {
  const [openEr, currencyApi] = await Promise.all([fetchFromOpenErApi(), fetchFromCurrencyApi()]);
  const rates = [openEr, currencyApi].filter((r): r is number => r != null);

  if (rates.length === 0) return null;

  rates.sort((a, b) => a - b);
  const median = rates.length === 1 ? rates[0] : (rates[0] + rates[1]) / 2;

  const source =
    rates.length >= 2 ? "live-median" : openEr != null ? "open.er-api.com" : "currency-api";

  return { rate: Math.round(median * 10000) / 10000, source };
}

export async function fetchUsdToGhsRate(): Promise<{ rate: number; source: string; fetchedAt: string | null }> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_MS) {
    return {
      rate: cachedRate.rate,
      source: cachedRate.source,
      fetchedAt: new Date(cachedRate.fetchedAt).toISOString(),
    };
  }

  const live = await fetchLiveUsdToGhsRate();
  if (live) {
    cachedRate = { rate: live.rate, fetchedAt: Date.now(), source: live.source };
    return { rate: live.rate, source: live.source, fetchedAt: new Date(cachedRate.fetchedAt).toISOString() };
  }

  const rate = staticUsdToGhsRate();
  cachedRate = { rate, fetchedAt: Date.now(), source: "env-fallback" };
  console.warn(
    `[paystackFx] Live USD/GHS unavailable — using fallback rate ${rate} (set PAYSTACK_USD_TO_GHS_RATE)`
  );
  return { rate, source: "env-fallback", fetchedAt: new Date(cachedRate.fetchedAt).toISOString() };
}

/** USD cents → GHS pesewas (Paystack minor unit for GHS). */
export async function usdCentsToGhsPesewas(usdCents: number): Promise<number> {
  const { rate } = await fetchUsdToGhsRate();
  const ghs = (usdCents / 100) * rate;
  return Math.max(100, Math.round(ghs * 100));
}

export function formatGhs(pesewas: number): string {
  return `GH₵${(pesewas / 100).toFixed(2)}`;
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function ghsPesewasForUsdCents(usdCents: number): Promise<{
  usdCents: number;
  ghsPesewas: number;
  usdLabel: string;
  ghsLabel: string;
  rate: number;
  rateSource: string;
  rateFetchedAt: string | null;
}> {
  const fx = await fetchUsdToGhsRate();
  const ghsPesewas = Math.max(100, Math.round((usdCents / 100) * fx.rate * 100));
  return {
    usdCents,
    ghsPesewas,
    usdLabel: formatUsd(usdCents),
    ghsLabel: formatGhs(ghsPesewas),
    rate: fx.rate,
    rateSource: fx.source,
    rateFetchedAt: fx.fetchedAt,
  };
}
