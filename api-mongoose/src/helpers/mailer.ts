import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { passwordResetEmailHtml, teamInviteEmailHtml } from "./emailTemplates";

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

export async function sendHtmlEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = createSmtpTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "alerts@winkwebhealth.com",
    to,
    subject,
    html,
  });
}

export function getMailErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Failed to send email";
  const msg = error.message;
  if (msg.includes("Invalid login") || msg.includes("535")) {
    return "SMTP authentication failed. Check SMTP_USER and SMTP_PASS in api-mongoose/.env";
  }
  if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
    return "SMTP host not found. Set SMTP_HOST to your mail server";
  }
  if (msg.includes("ECONNREFUSED")) {
    return "Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT";
  }
  return msg;
}

export async function sendTeamInviteEmail(
  to: string,
  name: string,
  inviterName: string,
  inviteToken: string,
  role: string,
): Promise<void> {
  const webUrl = (process.env.WEB_URL || "http://localhost:8080").replace(/\/$/, "");
  const inviteUrl = `${webUrl}/invite/${inviteToken}`;
  const roleLabel = { ADMIN: "Admin", MEMBER: "Member", VIEWER: "Viewer" }[role] || role;
  await sendHtmlEmail(
    to,
    `[WinkWebHealth] ${inviterName} invited you to the team`,
    teamInviteEmailHtml(name, inviterName, inviteUrl, roleLabel),
  );
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void> {
  const webUrl = (process.env.WEB_URL || "http://localhost:8080").replace(/\/$/, "");
  const resetUrl = `${webUrl}/auth/reset-password/${resetToken}`;
  await sendHtmlEmail(
    to,
    "[WinkWebHealth] Reset your password",
    passwordResetEmailHtml(name, resetUrl),
  );
}
