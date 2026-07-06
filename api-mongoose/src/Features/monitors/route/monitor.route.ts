import * as express from "express";
import { Request, Response } from "express";
import { MonitorController } from "../controllers/monitor.controller";
import { authentification } from "../../../middlewares/authentication.middleware";
import { attachWorkspace } from "../../../middlewares/workspace.middleware";

const Router = express.Router();

Router.use(authentification);
Router.use((req, res, next) => { void attachWorkspace(req, res, next); });

Router.get("/", (req, res) => { void MonitorController.list(req, res); });
Router.post("/", (req, res) => { void MonitorController.create(req, res); });
Router.get("/:id/checks", (req, res) => { void MonitorController.getChecks(req, res); });
Router.get("/:id/stats", (req, res) => { void MonitorController.getStats(req, res); });
Router.post("/:id/test-alerts", (req, res) => { void MonitorController.testAlerts(req, res); });
Router.get("/:id", (req, res) => { void MonitorController.getOne(req, res); });
Router.patch("/:id", (req, res) => { void MonitorController.update(req, res); });
Router.delete("/:id", (req, res) => { void MonitorController.remove(req, res); });

export default Router;
