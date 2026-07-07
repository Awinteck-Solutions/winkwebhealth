import * as express from "express";
import { BillingController } from "../controllers/billing.controller";

const webhookRouter = express.Router();

webhookRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => { void BillingController.stripeWebhook(req, res); }
);

webhookRouter.post(
  "/paystack/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => { void BillingController.paystackWebhook(req, res); }
);

export default webhookRouter;
