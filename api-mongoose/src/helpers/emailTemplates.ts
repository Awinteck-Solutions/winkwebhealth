const BRAND = "#2563EB";
const BRAND_DARK = "#1d4ed8";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

export function emailLayout(options: LayoutOptions): string {
  const {
    preheader = "",
    title,
    accentColor = BRAND,
    bodyHtml,
    cta,
    footerNote = "You received this email because of activity on your WinkWebHealth account.",
  } = options;

  const ctaBlock = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px">
        <tr>
          <td style="border-radius:8px;background:${accentColor}">
            <a href="${cta.url}" style="display:inline-block;padding:13px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;color:#64748b;font-size:12px;line-height:1.5;word-break:break-all">
        Or copy this link: <a href="${cta.url}" style="color:${BRAND}">${escapeHtml(cta.url)}</a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND},${BRAND_DARK});padding:22px 32px">
              <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em">WinkWebHealth</span>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Uptime monitoring &amp; alerts</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <h1 style="margin:0 0 20px;color:#0f172a;font-size:22px;font-weight:700;line-height:1.3">${escapeHtml(title)}</h1>
              ${bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:1.6">${footerNote}</p>
              <p style="margin:0;color:#94a3b8;font-size:11px">&copy; ${new Date().getFullYear()} WinkWebHealth</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;width:140px;vertical-align:top">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:500">${value}</td>
  </tr>`;
}

export function teamInviteEmailHtml(name: string, inviterName: string, inviteUrl: string, role: string): string {
  return emailLayout({
    preheader: `${inviterName} invited you to join their WinkWebHealth workspace as ${role}.`,
    title: "You've been invited to a team",
    bodyHtml: `
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.65">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.65">
        <strong>${escapeHtml(inviterName)}</strong> has invited you to collaborate on their WinkWebHealth monitoring workspace.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:4px 16px">
        ${detailRow("Your role", `<span style="color:${BRAND};font-weight:600">${escapeHtml(role)}</span>`)}
        ${detailRow("Access", escapeHtml(roleDescription(role)))}
        ${detailRow("Expires", "7 days from invitation")}
      </table>
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.65">
        Accept the invitation to create your password and access shared monitors, alerts, and status pages.
      </p>`,
    cta: { label: "Accept invitation", url: inviteUrl },
    footerNote: "If you weren't expecting this invitation, you can safely ignore this email.",
  });
}

export function passwordResetEmailHtml(name: string, resetUrl: string): string {
  return emailLayout({
    preheader: "Reset your WinkWebHealth password. This link expires in 1 hour.",
    title: "Reset your password",
    bodyHtml: `
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.65">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.65">
        We received a request to reset the password for your WinkWebHealth account. Click the button below to choose a new password.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px">
        <tr>
          <td style="color:#92400e;font-size:13px;line-height:1.55">
            <strong>Security note:</strong> This link expires in <strong>1 hour</strong>. If you didn't request a reset, no action is needed — your password will remain unchanged.
          </td>
        </tr>
      </table>`,
    cta: { label: "Reset password", url: resetUrl },
    footerNote: "For security, never share this link with anyone. WinkWebHealth will never ask for your password by email.",
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
  const accent = isTest ? BRAND : isDown ? "#dc2626" : "#059669";
  const badgeBg = isTest ? "#eff6ff" : isDown ? "#fef2f2" : "#ecfdf5";
  const badgeColor = isTest ? BRAND : isDown ? "#dc2626" : "#059669";
  const badgeLabel = isTest ? "TEST ALERT" : isDown ? "MONITOR DOWN" : "RECOVERED";
  const title = isTest
    ? `Test alert: ${payload.monitorName}`
    : isDown
      ? `${payload.monitorName} is down`
      : `${payload.monitorName} has recovered`;

  const summary = isTest
    ? "This is a test notification to verify your alert channel is working correctly. No action is required."
    : isDown
      ? "Your monitor failed its latest health check. Investigate the issue and confirm when service is restored."
      : "Your monitor is responding normally again. The incident has been marked as resolved.";

  let details = detailRow("Monitor", escapeHtml(payload.monitorName));
  details += detailRow("Status", `<span style="color:${badgeColor};font-weight:600">${payload.status}</span>`);
  details += detailRow("Detected at", escapeHtml(payload.timestamp));
  if (payload.responseTimeMs != null) {
    details += detailRow("Response time", `${payload.responseTimeMs} ms`);
  }
  if (payload.errorMessage) {
    details += detailRow("Details", `<span style="color:#dc2626">${escapeHtml(payload.errorMessage)}</span>`);
  }

  const dashboardBlock = dashboardUrl
    ? `<p style="margin:20px 0 0;color:#64748b;font-size:13px">
        <a href="${dashboardUrl}" style="color:${BRAND};font-weight:600;text-decoration:none">View monitor in dashboard →</a>
      </p>`
    : "";

  return emailLayout({
    preheader: `${badgeLabel}: ${payload.monitorName} — ${payload.timestamp}`,
    title,
    accentColor: accent,
    bodyHtml: `
      <p style="display:inline-block;margin:0 0 18px;padding:6px 12px;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:700;letter-spacing:0.06em;border-radius:999px">${badgeLabel}</p>
      <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.65">${summary}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:4px 16px">
        ${details}
      </table>
      ${dashboardBlock}`,
    footerNote: isTest
      ? "This test was triggered manually from your WinkWebHealth dashboard."
      : "You're receiving this because this monitor is linked to your alert channels.",
  });
}
