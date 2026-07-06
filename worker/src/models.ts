import { Schema, model } from "mongoose";

const monitorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["HTTP", "KEYWORD", "PORT", "SSL", "DNS"], required: true },
  url: { type: String, default: null },
  host: { type: String, default: null },
  port: { type: Number, default: null },
  keyword: { type: String, default: null },
  keywordType: { type: String, enum: ["EXISTS", "NOT_EXISTS", null], default: null },
  dnsRecordType: { type: String, enum: ["A", "AAAA", "CNAME", "MX", "TXT", "NS", null], default: null },
  dnsExpectedValue: { type: String, default: null },
  sslAlertDaysBefore: { type: Number, default: 30 },
  intervalSeconds: { type: Number, required: true },
  timeoutSeconds: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  currentStatus: { type: String, enum: ["UP", "DOWN", "PAUSED", "PENDING"], default: "PENDING" },
  lastCheckedAt: { type: Date, default: null },
  alertChannelIds: [{ type: Schema.Types.ObjectId, ref: "AlertChannel" }],
}, { timestamps: true });

const checkSchema = new Schema({
  monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
  status: { type: String, enum: ["UP", "DOWN"], required: true },
  responseTimeMs: { type: Number, required: true },
  statusCode: { type: Number, default: null },
  errorMessage: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: null },
  checkedAt: { type: Date, required: true, default: Date.now },
});
checkSchema.index({ monitorId: 1, checkedAt: -1 });

const incidentSchema = new Schema({
  monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
  startedAt: { type: Date, required: true },
  resolvedAt: { type: Date, default: null },
  durationSeconds: { type: Number, default: null },
  cause: { type: String, default: null },
}, { timestamps: true });

const alertChannelSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["EMAIL", "DISCORD", "SLACK", "WEBHOOK"], required: true },
  name: { type: String, required: true },
  config: { type: Schema.Types.Mixed, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const maintenanceWindowSchema = new Schema({
  monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  note: { type: String, default: null },
}, { timestamps: true });

export const Monitor = model("Monitor", monitorSchema);
export const Check = model("Check", checkSchema);
export const Incident = model("Incident", incidentSchema);
export const AlertChannel = model("AlertChannel", alertChannelSchema);
export const MaintenanceWindow = model("MaintenanceWindow", maintenanceWindowSchema);

export interface MonitorDoc {
  _id: string;
  name: string;
  type: "HTTP" | "KEYWORD" | "PORT" | "SSL" | "DNS";
  url?: string;
  host?: string;
  port?: number;
  keyword?: string;
  keywordType?: "EXISTS" | "NOT_EXISTS";
  dnsRecordType?: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";
  dnsExpectedValue?: string;
  sslAlertDaysBefore?: number;
  timeoutSeconds: number;
  currentStatus: string;
  alertChannelIds: string[];
}
