/* Alert email templates — kept in sync with api-mongoose/src/helpers/emailTemplates.ts */

const BRAND = "#2563EB";
const BRAND_DARK = "#1d4ed8";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailLayout(options: {
  preheader?: string;
  title: string;
  accentColor?: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const {
    preheader = "",
    title,
    bodyHtml,
    footerNote = "You're receiving this because this monitor is linked to your alert channels.",
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <tr><td style="background:linear-gradient(135deg,${BRAND},${BRAND_DARK});padding:22px 32px">
          <span style="color:#ffffff;font-size:18px;font-weight:700">WinkWebHealth</span>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Uptime monitoring &amp; alerts</p>
        </td></tr>
        <tr><td style="padding:32px"><h1 style="margin:0 0 20px;color:#0f172a;font-size:22px;font-weight:700">${escapeHtml(title)}</h1>${bodyHtml}</td></tr>
        <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
          <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:1.6">${footerNote}</p>
          <p style="margin:0;color:#94a3b8;font-size:11px">&copy; ${new Date().getFullYear()} WinkWebHealth</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;width:140px">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:500">${value}</td>
  </tr>`;
}

export interface AlertEmailPayload {
  monitorName: string;
  status: "UP" | "DOWN";
  event: "down" | "recovered";
  timestamp: string;
  responseTimeMs?: number;
  errorMessage?: string | null;
}

export function alertEmailHtml(payload: AlertEmailPayload, dashboardUrl?: string): string {
  const isDown = payload.event === "down";
  const badgeBg = isDown ? "#fef2f2" : "#ecfdf5";
  const badgeColor = isDown ? "#dc2626" : "#059669";
  const badgeLabel = isDown ? "MONITOR DOWN" : "RECOVERED";
  const title = isDown ? `${payload.monitorName} is down` : `${payload.monitorName} has recovered`;
  const summary = isDown
    ? "Your monitor failed its latest health check. Investigate the issue and confirm when service is restored."
    : "Your monitor is responding normally again. The incident has been marked as resolved.";

  let details = detailRow("Monitor", escapeHtml(payload.monitorName));
  details += detailRow("Status", `<span style="color:${badgeColor};font-weight:600">${payload.status}</span>`);
  details += detailRow("Detected at", escapeHtml(payload.timestamp));
  if (payload.responseTimeMs != null) details += detailRow("Response time", `${payload.responseTimeMs} ms`);
  if (payload.errorMessage) details += detailRow("Details", `<span style="color:#dc2626">${escapeHtml(payload.errorMessage)}</span>`);

  const dashboardBlock = dashboardUrl
    ? `<p style="margin:20px 0 0"><a href="${dashboardUrl}" style="color:${BRAND};font-weight:600;text-decoration:none">View monitor in dashboard →</a></p>`
    : "";

  return emailLayout({
    preheader: `${badgeLabel}: ${payload.monitorName} — ${payload.timestamp}`,
    title,
    bodyHtml: `
      <p style="display:inline-block;margin:0 0 18px;padding:6px 12px;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:700;letter-spacing:0.06em;border-radius:999px">${badgeLabel}</p>
      <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.65">${summary}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:4px 16px">${details}</table>
      ${dashboardBlock}`,
  });
}
