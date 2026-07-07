import * as express from "express";
import { authentification } from "../../../middlewares/authentication.middleware";
import { WorkspaceController } from "../controllers/workspace.controller";

const Router = express.Router();

Router.use(authentification);

Router.get("/", (req, res) => { void WorkspaceController.list(req, res); });
Router.post("/switch", (req, res) => { void WorkspaceController.switchWorkspace(req, res); });

export default Router;
