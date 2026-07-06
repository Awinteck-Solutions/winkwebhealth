import { Request, Response } from "express";
import StatusPage from "../schema/statusPage.schema";
import Monitor from "../../monitors/schema/monitor.schema";
import Check from "../../monitors/schema/check.schema";
import Incident from "../../incidents/schema/incident.schema";
import { getWorkspaceOwnerId, isViewer } from "../../../helpers/requestUser";
import { validateStatusPageLimit } from "../../../helpers/planLimits";

export class StatusPageController {
  static async list(req: Request, res: Response) {
    try {
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const pages = await StatusPage.find({ userId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: pages });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (isViewer(req)) {
        return res.status(403).json({ success: false, message: "View-only access" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const validation = await validateStatusPageLimit(userId);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      const { slug, title, isPublic = true, monitors = [] } = req.body;
      const page = await StatusPage.create({ userId, slug, title, isPublic, monitors });
      return res.status(201).json({ success: true, data: page });
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 11000) {
        return res.status(400).json({ success: false, message: "Slug already taken" });
      }
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      if (isViewer(req)) {
        return res.status(403).json({ success: false, message: "View-only access" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const page = await StatusPage.findOne({ _id: req.params.id, userId });
      if (!page) return res.status(404).json({ success: false, message: "Status page not found" });

      if (req.body.title !== undefined) page.title = req.body.title;
      if (req.body.slug !== undefined) page.slug = req.body.slug;
      if (req.body.isPublic !== undefined) page.isPublic = req.body.isPublic;
      if (req.body.monitors !== undefined) page.monitors = req.body.monitors;

      await page.save();
      return res.status(200).json({ success: true, data: page });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      if (isViewer(req)) {
        return res.status(403).json({ success: false, message: "View-only access" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const page = await StatusPage.findOneAndDelete({ _id: req.params.id, userId });
      if (!page) return res.status(404).json({ success: false, message: "Status page not found" });

      return res.status(200).json({ success: true, message: "Status page deleted" });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async getPublic(req: Request, res: Response) {
    try {
      const page = await StatusPage.findOne({ slug: req.params.slug, isPublic: true });
      if (!page) return res.status(404).json({ success: false, message: "Status page not found" });

      const monitorIds = page.monitors.map((m: { monitorId: string }) => m.monitorId);
      const monitors = await Monitor.find({ _id: { $in: monitorIds } });

      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const monitorData = await Promise.all(
        monitors.map(async (monitor) => {
          const checks = await Check.find({
            monitorId: monitor._id,
            checkedAt: { $gte: since },
          }).sort({ checkedAt: 1 });

          const openIncidents = await Incident.find({
            monitorId: monitor._id,
            resolvedAt: null,
          });

          return {
            id: monitor._id,
            name: monitor.name,
            currentStatus: monitor.currentStatus,
            lastCheckedAt: monitor.lastCheckedAt,
            checks: checks.map((c) => ({
              status: c.status,
              checkedAt: c.checkedAt,
            })),
            openIncidents,
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: {
          title: page.title,
          slug: page.slug,
          monitors: monitorData,
        },
      });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }
}
