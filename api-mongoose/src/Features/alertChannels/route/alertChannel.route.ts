import * as express from "express";
import { Request, Response } from "express";
import { AlertChannelController } from "../controllers/alertChannel.controller";
import { authentification } from "../../../middlewares/authentication.middleware";
import { attachWorkspace } from "../../../middlewares/workspace.middleware";

const Router = express.Router();

Router.use(authentification);
Router.use((req, res, next) => { void attachWorkspace(req, res, next); });

Router.get("/", (req, res) => { void AlertChannelController.list(req, res); });
Router.post("/", (req, res) => { void AlertChannelController.create(req, res); });
Router.patch("/:id", (req, res) => { void AlertChannelController.update(req, res); });
Router.post("/:id/test", (req, res) => { void AlertChannelController.test(req, res); });
Router.delete("/:id", (req, res) => { void AlertChannelController.remove(req, res); });

export default Router;
