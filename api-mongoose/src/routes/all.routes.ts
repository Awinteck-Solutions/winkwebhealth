import * as express from "express"; 
import path = require("path");

import userRoutes from "../Features/auth/route/user.routes";
import authRoutes from "../Features/auth/route/auth.routes";
import accountsRoutes from '../Features/accounts/route/accounts.route';
import monitorRoutes from '../Features/monitors/route/monitor.route';
import alertChannelRoutes from '../Features/alertChannels/route/alertChannel.route';
import maintenanceWindowRoutes from '../Features/maintenanceWindows/route/maintenanceWindow.route';
import statusPageRoutes from '../Features/statusPages/route/statusPage.route';
import billingRoutes from '../Features/billing/route/billing.route';
import teamMemberRoutes from '../Features/teamMembers/route/teamMember.route';
import teamInviteRoutes from '../Features/teamMembers/route/teamInvite.route';
import workspaceRoutes from '../Features/workspaces/route/workspace.route';
import platformAdminRoutes from '../Features/platformAdmin/route/platformAdmin.route';

const Router = express.Router();

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: Authentication routes
 */
Router.use("/auth", authRoutes);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: User routes
 */
Router.use("/users", userRoutes);


Router.use("/test", accountsRoutes);

Router.use("/monitors", monitorRoutes);
Router.use("/monitors/:monitorId/maintenance", maintenanceWindowRoutes);
Router.use("/alert-channels", alertChannelRoutes);
Router.use("/status-pages", statusPageRoutes);
Router.use("/billing", billingRoutes);
Router.use("/workspaces", workspaceRoutes);
Router.use("/team-members", teamMemberRoutes);
Router.use("/team-invites", teamInviteRoutes);
Router.use("/platform-admin", platformAdminRoutes);
 

export { Router }