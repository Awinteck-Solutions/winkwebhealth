import * as net from "net";
import * as https from "https";
import * as http from "http";
import * as tls from "tls";
import * as dns from "dns/promises";
import { resolveCheckHost, parseHostInput } from "./monitorInput";

export interface CheckResult {
  status: "UP" | "DOWN";
  responseTimeMs: number;
  statusCode: number | null;
  errorMessage: string | null;
  metadata?: Record<string, unknown> | null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    }),
  ]);
}

function httpGet(url: string, timeoutMs: number): Promise<{ statusCode: number; body: string; responseTimeMs: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode || 0, body, responseTimeMs: Date.now() - start });
      });
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.on("error", reject);
  });
}

function tcpConnect(host: string, port: number, timeoutMs: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const socket = net.createConnection({ host, port, timeout: timeoutMs }, () => {
      const elapsed = Date.now() - start;
      socket.destroy();
      resolve(elapsed);
    });
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Connection timed out"));
    });
    socket.on("error", reject);
  });
}

function checkSslCertificate(
  host: string,
  port: number,
  alertDaysBefore: number,
  timeoutMs: number
): Promise<CheckResult> {
  const start = Date.now();

  return new Promise((resolve) => {
    const socket = tls.connect(
      { host, port, servername: host, rejectUnauthorized: false, timeout: timeoutMs },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        const responseTimeMs = Date.now() - start;

        if (!cert || !cert.valid_to) {
          resolve({
            status: "DOWN",
            responseTimeMs,
            statusCode: null,
            errorMessage: "No certificate found",
            metadata: null,
          });
          return;
        }

        const validTo = new Date(cert.valid_to);
        const daysRemaining = Math.ceil((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const metadata = {
          validTo: validTo.toISOString(),
          daysRemaining,
          issuer: cert.issuer?.O || cert.issuer?.CN || null,
          subject: cert.subject?.CN || host,
        };

        if (validTo.getTime() < Date.now()) {
          resolve({
            status: "DOWN",
            responseTimeMs,
            statusCode: null,
            errorMessage: "Certificate expired",
            metadata,
          });
          return;
        }

        if (daysRemaining <= alertDaysBefore) {
          resolve({
            status: "DOWN",
            responseTimeMs,
            statusCode: null,
            errorMessage: `Certificate expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
            metadata,
          });
          return;
        }

        resolve({
          status: "UP",
          responseTimeMs,
          statusCode: null,
          errorMessage: null,
          metadata,
        });
      }
    );

    socket.on("error", (error) => {
      resolve({
        status: "DOWN",
        responseTimeMs: Date.now() - start,
        statusCode: null,
        errorMessage: error.message,
        metadata: null,
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        status: "DOWN",
        responseTimeMs: Date.now() - start,
        statusCode: null,
        errorMessage: "SSL connection timed out",
        metadata: null,
      });
    });
  });
}

async function resolveDnsRecords(host: string, recordType: string): Promise<string[]> {
  switch (recordType) {
    case "AAAA":
      return (await dns.resolve6(host)).map(String);
    case "CNAME":
      return dns.resolveCname(host);
    case "MX":
      return (await dns.resolveMx(host)).map((r) => `${r.exchange} (priority ${r.priority})`);
    case "TXT":
      return (await dns.resolveTxt(host)).map((parts) => parts.join(""));
    case "NS":
      return dns.resolveNs(host);
    case "A":
    default:
      return (await dns.resolve4(host)).map(String);
  }
}

async function checkDnsRecords(
  host: string,
  recordType: string,
  expectedValue: string | null | undefined,
  timeoutMs: number
): Promise<CheckResult> {
  const start = Date.now();

  try {
    const records = await withTimeout(
      resolveDnsRecords(host, recordType),
      timeoutMs,
      "DNS lookup"
    );
    const responseTimeMs = Date.now() - start;
    const metadata = { recordType, records };

    if (!records.length) {
      return {
        status: "DOWN",
        responseTimeMs,
        statusCode: null,
        errorMessage: "No DNS records found",
        metadata,
      };
    }

    if (expectedValue?.trim()) {
      const expected = expectedValue.trim().toLowerCase();
      const match = records.some((record) => {
        const value = record.toLowerCase();
        return value === expected || value.includes(expected);
      });

      if (!match) {
        return {
          status: "DOWN",
          responseTimeMs,
          statusCode: null,
          errorMessage: `Expected "${expectedValue}" not found in ${records.join(", ")}`,
          metadata,
        };
      }
    }

    return {
      status: "UP",
      responseTimeMs,
      statusCode: null,
      errorMessage: null,
      metadata,
    };
  } catch (error) {
    return {
      status: "DOWN",
      responseTimeMs: Date.now() - start,
      statusCode: null,
      errorMessage: error instanceof Error ? error.message : "DNS lookup failed",
      metadata: null,
    };
  }
}

export async function runMonitorCheck(monitor: {
  type: string;
  url?: string;
  host?: string;
  port?: number;
  keyword?: string;
  keywordType?: string;
  dnsRecordType?: string;
  dnsExpectedValue?: string;
  sslAlertDaysBefore?: number;
  timeoutSeconds: number;
}): Promise<CheckResult> {
  const timeoutMs = monitor.timeoutSeconds * 1000;

  try {
    if (monitor.type === "PORT") {
      const { host, port } = resolveCheckHost(monitor.host, monitor.port ?? undefined);
      const responseTimeMs = await tcpConnect(host, port, timeoutMs);
      return { status: "UP", responseTimeMs, statusCode: null, errorMessage: null };
    }

    if (monitor.type === "SSL") {
      const { host, port } = resolveCheckHost(monitor.host, monitor.port ?? 443);
      const alertDaysBefore = monitor.sslAlertDaysBefore ?? 30;
      return checkSslCertificate(host, port, alertDaysBefore, timeoutMs);
    }

    if (monitor.type === "DNS") {
      const { host } = parseHostInput(monitor.host);
      const recordType = monitor.dnsRecordType || "A";
      return checkDnsRecords(host, recordType, monitor.dnsExpectedValue, timeoutMs);
    }

    const url = monitor.url || "";
    const { statusCode, body, responseTimeMs } = await httpGet(url, timeoutMs);

    if (statusCode < 200 || statusCode >= 400) {
      return {
        status: "DOWN",
        responseTimeMs,
        statusCode,
        errorMessage: `HTTP ${statusCode}`,
      };
    }

    if (monitor.type === "KEYWORD" && monitor.keyword) {
      const found = body.includes(monitor.keyword);
      const shouldExist = monitor.keywordType !== "NOT_EXISTS";
      const keywordOk = shouldExist ? found : !found;
      if (!keywordOk) {
        return {
          status: "DOWN",
          responseTimeMs,
          statusCode,
          errorMessage: shouldExist
            ? `Keyword "${monitor.keyword}" not found`
            : `Keyword "${monitor.keyword}" should not exist`,
        };
      }
    }

    return { status: "UP", responseTimeMs, statusCode, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check failed";
    return { status: "DOWN", responseTimeMs: 0, statusCode: null, errorMessage: message };
  }
}

export async function runCheckWithRetry(
  monitor: Parameters<typeof runMonitorCheck>[0]
): Promise<CheckResult> {
  const first = await runMonitorCheck(monitor);
  if (first.status === "UP") return first;

  await new Promise((r) => setTimeout(r, 10000));
  return runMonitorCheck(monitor);
}
