import * as express from "express";
import { Request, Response } from "express";
import { MaintenanceWindowController } from "../controllers/maintenanceWindow.controller";
import { authentification } from "../../../middlewares/authentication.middleware";
import { attachWorkspace } from "../../../middlewares/workspace.middleware";

const Router = express.Router({ mergeParams: true });

Router.use(authentification);
Router.use((req, res, next) => { void attachWorkspace(req, res, next); });

Router.get("/", (req, res) => { void MaintenanceWindowController.list(req, res); });
Router.post("/", (req, res) => { void MaintenanceWindowController.create(req, res); });
Router.delete("/:id", (req, res) => { void MaintenanceWindowController.remove(req, res); });

export default Router;
