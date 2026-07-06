import { Request, Response } from "express";
import MaintenanceWindow from "../schema/maintenanceWindow.schema";
import Monitor from "../../monitors/schema/monitor.schema";
import { getWorkspaceOwnerId, toObjectId, isViewer } from "../../../helpers/requestUser";
import { validateMaintenanceAllowed } from "../../../helpers/planLimits";

export class MaintenanceWindowController {
  static async list(req: Request, res: Response) {
    try {
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const monitor = await Monitor.findOne({ _id: req.params.monitorId, userId: toObjectId(userId) });
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });

      const windows = await MaintenanceWindow.find({ monitorId: monitor._id }).sort({ startsAt: -1 });
      return res.status(200).json({ success: true, data: windows });
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

      const monitor = await Monitor.findOne({ _id: req.params.monitorId, userId: toObjectId(userId) });
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });

      const validation = await validateMaintenanceAllowed(userId);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      const { startsAt, endsAt, note } = req.body;
      const window = await MaintenanceWindow.create({
        monitorId: monitor._id,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        note,
      });

      return res.status(201).json({ success: true, data: window });
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

      const monitor = await Monitor.findOne({ _id: req.params.monitorId, userId: toObjectId(userId) });
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });

      const window = await MaintenanceWindow.findOneAndDelete({
        _id: req.params.id,
        monitorId: monitor._id,
      });
      if (!window) return res.status(404).json({ success: false, message: "Window not found" });

      return res.status(200).json({ success: true, message: "Maintenance window deleted" });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }
}
