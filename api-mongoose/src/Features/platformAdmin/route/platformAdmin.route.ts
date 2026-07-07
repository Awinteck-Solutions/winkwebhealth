import * as express from "express";
import { authentification } from "../../../middlewares/authentication.middleware";
import { requireSuperAdmin } from "../../../middlewares/superAdmin.middleware";
import { PlatformAdminController } from "../controllers/platformAdmin.controller";

const Router = express.Router();

Router.use(authentification);

Router.get("/me", (req, res) => { void PlatformAdminController.me(req, res); });

Router.use(requireSuperAdmin);

Router.get("/overview", (req, res) => { void PlatformAdminController.overview(req, res); });
Router.get("/tenants", (req, res) => { void PlatformAdminController.tenants(req, res); });
Router.get("/tenants/:id", (req, res) => { void PlatformAdminController.tenantDetail(req, res); });
Router.patch("/tenants/:id", (req, res) => { void PlatformAdminController.updateTenant(req, res); });
Router.get("/workspaces", (req, res) => { void PlatformAdminController.workspaces(req, res); });
Router.get("/subscriptions", (req, res) => { void PlatformAdminController.subscriptions(req, res); });
Router.get("/invoices", (req, res) => { void PlatformAdminController.invoices(req, res); });
Router.get("/monitors", (req, res) => { void PlatformAdminController.monitors(req, res); });

export default Router;
