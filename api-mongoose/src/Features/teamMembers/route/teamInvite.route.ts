import * as express from "express";
import { TeamInviteController } from "../controllers/teamInvite.controller";

const Router = express.Router();

Router.get("/:token", (req, res) => { void TeamInviteController.getInvite(req, res); });
Router.post("/:token/accept", (req, res) => { void TeamInviteController.acceptInvite(req, res); });

export default Router;
