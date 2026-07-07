/** Platform super-admin access via SUPER_ADMIN_EMAILS env (comma-separated). */

export function getSuperAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowlist = getSuperAdminEmails();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}
