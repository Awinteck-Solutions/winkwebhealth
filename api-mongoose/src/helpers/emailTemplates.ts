/** WinkWebHealth email templates — light mode only (email clients ignore app dark theme). */

import { getLogoUrl, getWebUrl, SITE_NAME, SITE_TAGLINE, SITE_DOMAIN } from "./brand";

const BRAND = "#0D9488";
const BRAND_DARK = "#0F766E";
const BRAND_LIGHT = "#CCFBF1";
const WHITE = "#FFFFFF";
const TEXT_PRIMARY = "#0F172A";
const TEXT_BODY = "#334155";
const TEXT_LABEL = "#475569";
const TEXT_MUTED = "#64748B";
const BORDER = "#E2E8F0";
const SURFACE = "#F8FAFC";
const PAGE_BG = "#EEF2F6";
const FOOTER_BG = "#F1F5F9";

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function roleDescription(role: string): string {
  const map: Record<string, string> = {
    Admin: "Full access to monitors, alerts, team settings, and billing.",
    Member: "Create and manage monitors, alerts, and status pages.",
    Viewer: "Read-only access to monitors and incident history.",
  };
  return map[role] || "Collaborate on uptime monitoring and alerts.";
}

interface LayoutOptions {
  preheader?: string;
  title: string;
  accentColor?: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  footerNote?: string;
}

function emailHeader(): string {
  const logoUrl = getLogoUrl();
  const siteUrl = getWebUrl();
  return `<tr>
    <td bgcolor="${BRAND}" style="background-color:${BRAND};padding:24px 32px;border-bottom:3px solid ${BRAND_DARK}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="44" valign="middle" style="padding-right:14px">
            <a href="${siteUrl}" style="text-decoration:none">
              <img src="${logoUrl}" alt="${SITE_NAME}" width="40" height="40" style="display:block;width:40px;height:40px;border:0;border-radius:10px" />
            </a>
          </td>
          <td valign="middle">
            <p style="margin:0;color:${WHITE};font-size:20px;font-weight:700;letter-spacing:-0.02em;line-height:1.2">${SITE_NAME}</p>
            <p style="margin:4px 0 0;color:${WHITE};font-size:13px;font-weight:500;line-height:1.4;opacity:0.92">${SITE_TAGLINE}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function emailFooter(note: string): string {
  const siteUrl = getWebUrl();
  return `<tr>
    <td bgcolor="${FOOTER_BG}" style="background-color:${FOOTER_BG};padding:22px 32px;border-top:1px solid ${BORDER}">
      <p style="margin:0 0 10px;color:${TEXT_LABEL};font-size:13px;line-height:1.6">${note}</p>
      <p style="margin:0;color:${TEXT_MUTED};font-size:12px;line-height:1.5">&copy; ${new Date().getFullYear()} ${SITE_NAME} &middot; <a href="${siteUrl}" style="color:${BRAND};text-decoration:none;font-weight:600">${SITE_DOMAIN}</a></p>
    </td>
  </tr>`;
}

function ctaButton(label: string, url: string, color: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 10px">
    <tr>
      <td bgcolor="${color}" style="background-color:${color};border-radius:8px">
        <a href="${url}" style="display:inline-block;padding:14px 28px;color:${WHITE};text-decoration:none;font-weight:600;font-size:15px;line-height:1.2">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>
  <p style="margin:0;color:${TEXT_MUTED};font-size:12px;line-height:1.6;word-break:break-all">
    Or copy this link:
    <a href="${url}" style="color:${BRAND};font-weight:600;text-decoration:underline">${escapeHtml(url)}</a>
  </p>`;
}

export function emailLayout(options: LayoutOptions): string {
  const {
    preheader = "",
    title,
    accentColor = BRAND,
    bodyHtml,
    cta,
    footerNote = `You received this email because of activity on your ${SITE_NAME} account.`,
  } = options;

  const ctaBlock = cta ? ctaButton(cta.label, cta.url, accentColor) : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body bgcolor="${PAGE_BG}" style="margin:0;padding:0;background-color:${PAGE_BG};font-family:${FONT};color:${TEXT_BODY};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:${PAGE_BG};opacity:0">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PAGE_BG}" style="background-color:${PAGE_BG};padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="${WHITE}" style="max-width:600px;width:100%;background-color:${WHITE};border:1px solid ${BORDER};border-radius:12px;overflow:hidden">
          ${emailHeader()}
          <tr>
            <td bgcolor="${WHITE}" style="background-color:${WHITE};padding:32px">
              <h1 style="margin:0 0 18px;color:${TEXT_PRIMARY};font-size:24px;font-weight:700;line-height:1.3;letter-spacing:-0.02em">${escapeHtml(title)}</h1>
              ${bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          ${emailFooter(footerNote)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string, isLast = false): string {
  const border = isLast ? "none" : `1px solid ${BORDER}`;
  return `<tr>
    <td style="padding:14px 0;border-bottom:${border}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="top" width="132" style="color:${TEXT_LABEL};font-size:13px;font-weight:600;line-height:1.5;padding-right:12px">${escapeHtml(label)}</td>
          <td valign="top" style="color:${TEXT_PRIMARY};font-size:14px;font-weight:600;line-height:1.5">${value}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function detailRows(items: { label: string; value: string }[]): string {
  return items
    .map((item, index) => detailRow(item.label, item.value, index === items.length - 1))
    .join("");
}

function infoTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${SURFACE}" style="background-color:${SURFACE};border:1px solid ${BORDER};border-radius:10px;margin:0 0 8px">
    <tr>
      <td style="padding:4px 18px">${rows}</td>
    </tr>
  </table>`;
}

function statusBadge(label: string, bg: string, color: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px">
    <tr>
      <td bgcolor="${bg}" style="background-color:${bg};color:${color};font-size:11px;font-weight:700;letter-spacing:0.08em;padding:7px 14px;border-radius:999px;text-transform:uppercase">${escapeHtml(label)}</td>
    </tr>
  </table>`;
}

function bodyParagraph(text: string): string {
  return `<p style="margin:0 0 16px;color:${TEXT_BODY};font-size:15px;line-height:1.7">${text}</p>`;
}

function textLink(label: string, url: string): string {
  return `<p style="margin:22px 0 0">
    <a href="${url}" style="color:${BRAND};font-weight:600;font-size:14px;text-decoration:none;border-bottom:1px solid ${BRAND_LIGHT};padding-bottom:2px">${escapeHtml(label)} &rarr;</a>
  </p>`;
}

export function teamInviteEmailHtml(name: string, inviterName: string, inviteUrl: string, role: string): string {
  return emailLayout({
    preheader: `${inviterName} invited you to join their WinkWebHealth workspace as ${role}.`,
    title: "You've been invited to a team",
    bodyHtml: `
      ${bodyParagraph(`Hi ${escapeHtml(name)},`)}
      ${bodyParagraph(`<strong style="color:${TEXT_PRIMARY}">${escapeHtml(inviterName)}</strong> has invited you to collaborate on their WinkWebHealth monitoring workspace.`)}
      ${infoTable(detailRows([
        { label: "Your role", value: `<span style="color:${BRAND}">${escapeHtml(role)}</span>` },
        { label: "Access", value: escapeHtml(roleDescription(role)) },
        { label: "Expires", value: "7 days from invitation" },
      ]))}
      ${bodyParagraph("Accept the invitation to create your password and access shared monitors, alerts, and status pages.")}`,
    cta: { label: "Accept invitation", url: inviteUrl },
    footerNote: "If you weren't expecting this invitation, you can safely ignore this email.",
  });
}

export function passwordResetEmailHtml(name: string, resetUrl: string): string {
  return emailLayout({
    preheader: "Reset your WinkWebHealth password. This link expires in 1 hour.",
    title: "Reset your password",
    bodyHtml: `
      ${bodyParagraph(`Hi ${escapeHtml(name)},`)}
      ${bodyParagraph("We received a request to reset the password for your WinkWebHealth account. Click the button below to choose a new password.")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFBEB" style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;margin:0 0 8px">
        <tr>
          <td style="padding:14px 18px;color:#92400E;font-size:13px;line-height:1.6">
            <strong style="color:#78350F">Security note:</strong> This link expires in <strong>1 hour</strong>. If you didn't request a reset, no action is needed.
          </td>
        </tr>
      </table>`,
    cta: { label: "Reset password", url: resetUrl },
    footerNote: "WinkWebHealth will never ask for your password by email.",
  });
}

export interface AlertEmailPayload {
  monitorName: string;
  status: "UP" | "DOWN";
  event: "down" | "recovered";
  timestamp: string;
  responseTimeMs?: number;
  errorMessage?: string | null;
  isTest?: boolean;
}

export function alertEmailHtml(payload: AlertEmailPayload, dashboardUrl?: string): string {
  const isDown = payload.event === "down";
  const isTest = payload.isTest ?? false;
  const accent = isTest ? BRAND : isDown ? "#DC2626" : "#059669";
  const badgeBg = isTest ? "#ECFDF5" : isDown ? "#FEF2F2" : "#ECFDF5";
  const badgeColor = isTest ? BRAND_DARK : isDown ? "#B91C1C" : "#047857";
  const badgeLabel = isTest ? "TEST ALERT" : isDown ? "MONITOR DOWN" : "RECOVERED";
  const title = isTest
    ? `Test alert: ${payload.monitorName}`
    : isDown
      ? `${payload.monitorName} is down`
      : `${payload.monitorName} has recovered`;

  const summary = isTest
    ? "This is a test notification to verify your alert channel is working correctly."
    : isDown
      ? "Your monitor failed its latest health check. Investigate and confirm when service is restored."
      : "Your monitor is responding normally again.";

  const formattedTime = formatTimestamp(payload.timestamp);

  const rows: { label: string; value: string }[] = [
    { label: "Monitor", value: escapeHtml(payload.monitorName) },
    { label: "Status", value: `<span style="color:${badgeColor}">${payload.status}</span>` },
    { label: "Detected at", value: escapeHtml(formattedTime) },
  ];
  if (payload.responseTimeMs != null) {
    rows.push({ label: "Response time", value: `${payload.responseTimeMs} ms` });
  }
  if (payload.errorMessage) {
    rows.push({ label: "Details", value: `<span style="color:#B91C1C">${escapeHtml(payload.errorMessage)}</span>` });
  }

  const dashboardBlock = dashboardUrl ? textLink("View monitor in dashboard", dashboardUrl) : "";

  return emailLayout({
    preheader: `${badgeLabel}: ${payload.monitorName}`,
    title,
    accentColor: accent,
    bodyHtml: `
      ${statusBadge(badgeLabel, badgeBg, badgeColor)}
      ${bodyParagraph(summary)}
      ${infoTable(detailRows(rows))}
      ${dashboardBlock}`,
    footerNote: isTest
      ? "This test was triggered from your WinkWebHealth dashboard."
      : "You're receiving this because this monitor is linked to your alert channels.",
  });
}

export function invoiceDueEmailHtml(params: {
  name: string;
  invoiceNumber: string;
  amountLabel: string;
  dueDate: string;
  paymentUrl: string;
}): string {
  return emailLayout({
    preheader: `Your WinkWebHealth Pro subscription renews on ${params.dueDate}.`,
    title: "Your Pro subscription is due for renewal",
    bodyHtml: `
      ${bodyParagraph(`Hi ${escapeHtml(params.name)},`)}
      ${bodyParagraph("Your WinkWebHealth Pro plan is coming up for renewal. Pay before the due date to keep uninterrupted monitoring and alerts.")}
      ${infoTable(detailRows([
        { label: "Invoice", value: escapeHtml(params.invoiceNumber) },
        { label: "Amount due", value: `<span style="color:${TEXT_PRIMARY}">${escapeHtml(params.amountLabel)}</span>` },
        { label: "Due date", value: escapeHtml(params.dueDate) },
      ]))}`,
    cta: { label: "Pay now", url: params.paymentUrl },
    footerNote: "If you've already paid, you can ignore this reminder.",
  });
}

export function paymentReceiptEmailHtml(params: {
  name: string;
  invoiceNumber: string;
  amountLabel: string;
  periodEnd: string;
  receiptUrl: string;
}): string {
  return emailLayout({
    preheader: `Payment received — ${params.amountLabel} for WinkWebHealth Pro.`,
    title: "Payment received — thank you!",
    accentColor: "#059669",
    bodyHtml: `
      ${bodyParagraph(`Hi ${escapeHtml(params.name)},`)}
      ${bodyParagraph(`We've received your payment. Your Pro plan is active through <strong style="color:${TEXT_PRIMARY}">${escapeHtml(params.periodEnd)}</strong>.`)}
      ${infoTable(detailRows([
        { label: "Receipt", value: escapeHtml(params.invoiceNumber) },
        { label: "Amount paid", value: `<span style="color:#047857">${escapeHtml(params.amountLabel)}</span>` },
        { label: "Coverage until", value: escapeHtml(params.periodEnd) },
      ]))}`,
    cta: { label: "View receipt", url: params.receiptUrl },
    footerNote: "Keep this email for your records.",
  });
}
