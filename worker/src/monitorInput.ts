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

export function resolveCheckHost(host?: string, port?: number): { host: string; port: number } {
  const parsed = parseHostInput(host);
  return {
    host: parsed.host,
    port: parsed.port ?? port ?? 80,
  };
}
