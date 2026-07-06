import * as express from "express";
import { Request, Response } from "express";
import { StatusPageController } from "../controllers/statusPage.controller";
import { authentification } from "../../../middlewares/authentication.middleware";
import { attachWorkspace } from "../../../middlewares/workspace.middleware";

const Router = express.Router();

Router.get("/public/:slug", (req, res) => { void StatusPageController.getPublic(req, res); });

Router.use(authentification);
Router.use((req, res, next) => { void attachWorkspace(req, res, next); });

Router.get("/", (req, res) => { void StatusPageController.list(req, res); });
Router.post("/", (req, res) => { void StatusPageController.create(req, res); });
Router.patch("/:id", (req, res) => { void StatusPageController.update(req, res); });
Router.delete("/:id", (req, res) => { void StatusPageController.remove(req, res); });

export default Router;
