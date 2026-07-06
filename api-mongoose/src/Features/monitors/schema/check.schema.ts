const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const checkSchema = new Schema(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
    status: {
      type: String,
      enum: ["UP", "DOWN"],
      required: true,
    },
    responseTimeMs: { type: Number, required: true },
    statusCode: { type: Number, default: null },
    errorMessage: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    checkedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false }
);

checkSchema.index({ monitorId: 1, checkedAt: -1 });
checkSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Check = mongoose.model("Check", checkSchema);

export default Check;
