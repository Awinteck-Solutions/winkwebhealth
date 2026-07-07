import { Request, Response } from "express";
import { isSuperAdminEmail } from "../../../helpers/superAdmin";
import {
  getPlatformOverview,
  listTenants,
  getTenantDetail,
  updateTenant,
  listWorkspaces,
  listSubscriptions,
  listInvoices,
  listMonitors,
} from "../../../helpers/platformAdminService";

export class PlatformAdminController {
  static async me(req: Request, res: Response) {
    const email = req.currentUser?.email;
    if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!isSuperAdminEmail(email)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return res.status(200).json({
      success: true,
      data: { isSuperAdmin: true, email },
    });
  }

  static async overview(_req: Request, res: Response) {
    try {
      const data = await getPlatformOverview();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("[platform-admin] overview", err);
      return res.status(500).json({ success: false, message: "Failed to load overview" });
    }
  }

  static async tenants(req: Request, res: Response) {
    try {
      const data = await listTenants(req.query as Record<string, unknown>);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("[platform-admin] tenants", err);
      return res.status(500).json({ success: false, message: "Failed to load tenants" });
    }
  }

  static async tenantDetail(req: Request, res: Response) {
    try {
      const data = await getTenantDetail(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Tenant not found" });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("[platform-admin] tenant detail", err);
      return res.status(500).json({ success: false, message: "Failed to load tenant" });
    }
  }

  static async updateTenant(req: Request, res: Response) {
    try {
      const user = await updateTenant(req.params.id, req.body);
      if (!user) return res.status(400).json({ success: false, message: "No valid updates provided" });
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      console.error("[platform-admin] update tenant", err);
      return res.status(500).json({ success: false, message: "Failed to update tenant" });
    }
  }

  static async workspaces(req: Request, res: Response) {
    try {
      const data = await listWorkspaces(req.query as Record<string, unknown>);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("[platform-admin] workspaces", err);
      return res.status(500).json({ success: false, message: "Failed to load workspaces" });
    }
  }

  static async subscriptions(req: Request, res: Response) {
    try {
      const data = await listSubscriptions(req.query as Record<string, unknown>);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("[platform-admin] subscriptions", err);
      return res.status(500).json({ success: false, message: "Failed to load subscriptions" });
    }
  }

  static async invoices(req: Request, res: Response) {
    try {
      const data = await listInvoices(req.query as Record<string, unknown>);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("[platform-admin] invoices", err);
      return res.status(500).json({ success: false, message: "Failed to load invoices" });
    }
  }

  static async monitors(req: Request, res: Response) {
    try {
      const data = await listMonitors(req.query as Record<string, unknown>);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("[platform-admin] monitors", err);
      return res.status(500).json({ success: false, message: "Failed to load monitors" });
    }
  }
}
