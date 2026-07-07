import * as express from "express";
import { BillingController } from "../controllers/billing.controller";
import { authentification } from "../../../middlewares/authentication.middleware";
import { attachWorkspace } from "../../../middlewares/workspace.middleware";

const Router = express.Router();

Router.get("/receipt/:token", (req, res) => { void BillingController.getReceipt(req, res); });

Router.use(authentification);
Router.use((req, res, next) => { void attachWorkspace(req, res, next); });

Router.get("/plan", (req, res) => { void BillingController.getPlan(req, res); });
Router.get("/invoices", (req, res) => { void BillingController.getPlan(req, res); });
Router.post("/checkout", (req, res) => { void BillingController.createCheckout(req, res); });
Router.post("/verify", (req, res) => { void BillingController.verifyPayment(req, res); });
Router.post("/cancel", (req, res) => { void BillingController.cancelSubscription(req, res); });
Router.post("/portal", (req, res) => { void BillingController.createPortal(req, res); });

export default Router;
