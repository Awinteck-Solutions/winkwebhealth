import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { alertEmailHtml } from "./emailTemplates";

interface AlertPayload {
  monitorName: string;
  status: "UP" | "DOWN";
  event: "down" | "recovered";
  timestamp: string;
  responseTimeMs?: number;
  errorMessage?: string | null;
  isTest?: boolean;
}

function buildEmailHtml(payload: AlertPayload): string {
  const webUrl = (process.env.WEB_URL || "http://localhost:8080").replace(/\/$/, "");
  return alertEmailHtml(payload, `${webUrl}/dashboard/monitors`);
}

function buildDiscordPayload(payload: AlertPayload) {
  const isDown = payload.event === "down";
  const isTest = payload.isTest ?? false;
  const color = isTest ? 0x2563eb : isDown ? 0xdc2626 : 0x059669;
  const title = payload.isTest
    ? `🧪 Test alert: ${payload.monitorName}`
    : `${payload.event === "down" ? "🔴" : "🟢"} ${payload.monitorName}`;
  return {
    embeds: [{
      title,
      description: payload.isTest
        ? "This is a test notification from WinkWebHealth."
        : payload.event === "down" ? "Monitor is DOWN" : "Monitor recovered",
      color,
      fields: [
        { name: "Time", value: payload.timestamp, inline: true },
        ...(payload.responseTimeMs != null ? [{ name: "Response", value: `${payload.responseTimeMs}ms`, inline: true }] : []),
        ...(payload.errorMessage ? [{ name: "Error", value: payload.errorMessage }] : []),
      ],
    }],
  };
}

function getSmtpConfigError(): string | null {
  const host = process.env.SMTP_HOST?.trim();
  if (!host || host === "smtp.example.com") {
    return "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in api-mongoose/.env";
  }
  if (!process.env.SMTP_USER?.trim() || !process.env.SMTP_PASS?.trim()) {
    return "SMTP credentials missing. Set SMTP_USER and SMTP_PASS in api-mongoose/.env";
  }
  return null;
}

function createSmtpTransporter(): Transporter {
  const configError = getSmtpConfigError();
  if (configError) throw new Error(configError);

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendAlert(
  channel: { type: string; config: Record<string, string> },
  payload: AlertPayload
): Promise<void> {
  const prefix = payload.isTest ? "[TEST] " : "";

  switch (channel.type) {
    case "EMAIL": {
      const to = channel.config?.email?.trim();
      if (!to) throw new Error("Email address not configured on this alert channel");

      const transporter = createSmtpTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "alerts@winkwebhealth.com",
        to,
        subject: `${prefix}[WinkWebHealth] ${payload.isTest ? "Test alert" : payload.event === "down" ? "DOWN" : "RECOVERED"}: ${payload.monitorName}`,
        html: buildEmailHtml(payload),
      });
      break;
    }
    case "DISCORD":
    case "SLACK": {
      const url = channel.config.webhookUrl;
      if (!url) throw new Error("Webhook URL not configured");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildDiscordPayload(payload)),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      break;
    }
    case "WEBHOOK": {
      const url = channel.config.url;
      if (!url) throw new Error("Webhook URL not configured");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test: payload.isTest ?? false,
          event: payload.event,
          monitor: payload.monitorName,
          status: payload.status,
          timestamp: payload.timestamp,
          responseTimeMs: payload.responseTimeMs,
          errorMessage: payload.errorMessage,
        }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      break;
    }
    default:
      throw new Error(`Unsupported channel type: ${channel.type}`);
  }
}

export function getAlertSendErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Failed to send notification";
  const msg = error.message;
  if (msg.includes("Invalid login") || msg.includes("535")) {
    return "SMTP authentication failed. Check SMTP_USER and SMTP_PASS in api-mongoose/.env";
  }
  if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
    return "SMTP host not found. Set SMTP_HOST to your mail server (e.g. mail.yourdomain.com)";
  }
  if (msg.includes("ECONNREFUSED")) {
    return "Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT";
  }
  return msg;
}
