const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const maintenanceWindowSchema = new Schema(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true, index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    note: { type: String, default: null },
  },
  { timestamps: true }
);

const MaintenanceWindow = mongoose.model("MaintenanceWindow", maintenanceWindowSchema);

export default MaintenanceWindow;
