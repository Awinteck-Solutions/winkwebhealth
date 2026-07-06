const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const alertChannelSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["EMAIL", "DISCORD", "SLACK", "WEBHOOK"],
      required: true,
    },
    name: { type: String, required: true },
    config: { type: Schema.Types.Mixed, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const AlertChannel = mongoose.model("AlertChannel", alertChannelSchema);

export default AlertChannel;
