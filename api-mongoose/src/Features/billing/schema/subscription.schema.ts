import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["PAYSTACK", "STRIPE"], required: true },
    interval: { type: String, enum: ["monthly", "yearly"], required: true },
    status: {
      type: String,
      enum: ["active", "past_due", "cancelled"],
      default: "active",
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    providerCustomerId: { type: String, default: null },
    providerSubscriptionId: { type: String, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1, status: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
