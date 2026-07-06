const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const incidentSchema = new Schema(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true, index: true },
    startedAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: null },
    cause: { type: String, default: null },
  },
  { timestamps: true }
);

const Incident = mongoose.model("Incident", incidentSchema);

export default Incident;
