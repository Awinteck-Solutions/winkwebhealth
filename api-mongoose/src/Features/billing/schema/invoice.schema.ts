import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", default: null },
    invoiceNumber: { type: String, required: true, unique: true },
    amountCents: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    chargeAmountMinor: { type: Number, default: null },
    chargeCurrency: { type: String, default: null },
    interval: { type: String, enum: ["monthly", "yearly"], required: true },
    status: { type: String, enum: ["open", "paid", "void"], default: "open" },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    paymentUrl: { type: String, default: null },
    providerReference: { type: String, default: null, index: true, sparse: true },
    paidAt: { type: Date, default: null },
    receiptToken: { type: String, default: null, unique: true, sparse: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ userId: 1, status: 1, createdAt: -1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
