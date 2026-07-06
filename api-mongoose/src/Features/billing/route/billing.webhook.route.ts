import * as express from "express";
import { Request, Response } from "express";
import { BillingController } from "../controllers/billing.controller";

const webhookRouter = express.Router();

webhookRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => { void BillingController.webhook(req, res); }
);

export default webhookRouter;
