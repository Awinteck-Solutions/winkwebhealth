import * as express from "express";
import { Request, Response } from "express";
import { BillingController } from "../controllers/billing.controller";
import { authentification } from "../../../middlewares/authentication.middleware";
import { attachWorkspace } from "../../../middlewares/workspace.middleware";

const Router = express.Router();

Router.use(authentification);
Router.use((req, res, next) => { void attachWorkspace(req, res, next); });

Router.get("/plan", (req, res) => { void BillingController.getPlan(req, res); });
Router.post("/checkout", (req, res) => { void BillingController.createCheckout(req, res); });
Router.post("/portal", (req, res) => { void BillingController.createPortal(req, res); });

export default Router;
