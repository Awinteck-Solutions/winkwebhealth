/** Strip URL prefixes and paths so PORT/SSL/DNS checks get a valid hostname or IP. */
export function parseHostInput(raw?: string | null): { host: string; port?: number } {
  if (!raw?.trim()) return { host: "" };

  let input = raw.trim().replace(/^https?:\/\//i, "");
  input = input.split("/")[0].split("?")[0].split("#")[0];

  const ipv6Match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
  if (ipv6Match) {
    return {
      host: ipv6Match[1],
      port: ipv6Match[2] ? parseInt(ipv6Match[2], 10) : undefined,
    };
  }

  const lastColon = input.lastIndexOf(":");
  if (lastColon > 0 && /^\d+$/.test(input.slice(lastColon + 1))) {
    return {
      host: input.slice(0, lastColon),
      port: parseInt(input.slice(lastColon + 1), 10),
    };
  }

  return { host: input };
}

export function normalizeMonitorHostFields(body: {
  type?: string;
  host?: string | null;
  port?: number | null;
}): { host?: string | null; port?: number | null } {
  if (!body.host || !["PORT", "SSL", "DNS"].includes(body.type || "")) {
    return { host: body.host, port: body.port };
  }

  const parsed = parseHostInput(body.host);
  const port =
    body.type === "DNS"
      ? body.port
      : parsed.port ?? body.port ?? (body.type === "SSL" ? 443 : body.port);

  return {
    host: parsed.host || body.host,
    port: port ?? null,
  };
}
