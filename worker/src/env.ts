import path from "path";
import dotenv from "dotenv";

const apiEnvPath = path.resolve(__dirname, "../../api-mongoose/.env");
const localEnvPath = path.resolve(__dirname, "../.env");

// Docker / production: variables come from the environment (docker compose env_file).
dotenv.config();
dotenv.config({ path: localEnvPath });
dotenv.config({ path: apiEnvPath });

export function logWorkerEnvStatus(): void {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpReady = Boolean(
    smtpHost
    && smtpHost !== "smtp.example.com"
    && process.env.SMTP_USER?.trim()
    && process.env.SMTP_PASS?.trim(),
  );

  console.log(JSON.stringify({
    level: "info",
    message: "Worker environment",
    smtpReady,
    smtpHost: smtpHost || null,
    redisUrl: process.env.REDIS_URL ? "set" : "missing",
    dbUrl: process.env.DB_URL ? "set" : "missing",
  }));

  if (!smtpReady) {
    console.warn(JSON.stringify({
      level: "warn",
      message: "Email alerts will fail until SMTP_HOST, SMTP_USER, and SMTP_PASS are configured",
    }));
  }
}
