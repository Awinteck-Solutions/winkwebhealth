const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statusPageMonitorSchema = new Schema(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const statusPageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    customDomain: { type: String, default: null },
    monitors: [statusPageMonitorSchema],
  },
  { timestamps: true }
);

const StatusPage = mongoose.model("StatusPage", statusPageSchema);

export default StatusPage;
