import * as express from "express";
import { TeamMemberController } from "../controllers/teamMember.controller";
import { authentification } from "../../../middlewares/authentication.middleware";
import { attachWorkspace } from "../../../middlewares/workspace.middleware";

const Router = express.Router();

Router.use(authentification);
Router.use((req, res, next) => { void attachWorkspace(req, res, next); });

Router.get("/", (req, res) => { void TeamMemberController.list(req, res); });
Router.post("/", (req, res) => { void TeamMemberController.create(req, res); });
Router.patch("/:id", (req, res) => { void TeamMemberController.update(req, res); });
Router.post("/:id/resend-invite", (req, res) => { void TeamMemberController.resendInvite(req, res); });
Router.delete("/:id", (req, res) => { void TeamMemberController.remove(req, res); });

export default Router;
