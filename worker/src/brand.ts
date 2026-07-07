/** Shared WinkWebHealth brand — keep in sync with api-mongoose/src/helpers/brand.ts */

export const SITE_NAME = "WinkWebHealth";
export const SITE_TAGLINE = "Uptime monitoring & alerts";
export const SITE_DOMAIN = "winkwebhealth.com";
export const DEFAULT_SITE_URL = "https://winkwebhealth.com";

export function getWebUrl(): string {
  const raw = process.env.WEB_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function getLogoUrl(): string {
  const override = process.env.EMAIL_LOGO_URL?.trim();
  if (override) return override;
  return `${getWebUrl()}/logo.png`;
}
