const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const monitorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["HTTP", "KEYWORD", "PORT", "SSL", "DNS"],
      required: true,
    },
    url: { type: String, default: null },
    host: { type: String, default: null },
    port: { type: Number, default: null },
    keyword: { type: String, default: null },
    keywordType: {
      type: String,
      enum: ["EXISTS", "NOT_EXISTS", null],
      default: null,
    },
    dnsRecordType: {
      type: String,
      enum: ["A", "AAAA", "CNAME", "MX", "TXT", "NS", null],
      default: null,
    },
    dnsExpectedValue: { type: String, default: null },
    sslAlertDaysBefore: { type: Number, default: 30 },
    intervalSeconds: { type: Number, required: true, default: 300 },
    timeoutSeconds: { type: Number, required: true, default: 30 },
    isActive: { type: Boolean, default: true },
    currentStatus: {
      type: String,
      enum: ["UP", "DOWN", "PAUSED", "PENDING"],
      default: "PENDING",
    },
    lastCheckedAt: { type: Date, default: null },
    alertChannelIds: [{ type: Schema.Types.ObjectId, ref: "AlertChannel" }],
  },
  { timestamps: true }
);

const Monitor = mongoose.model("Monitor", monitorSchema);

export default Monitor;
