import { Request, Response } from "express";
import AlertChannel from "../schema/alertChannel.schema";
import { getWorkspaceOwnerId, isViewer } from "../../../helpers/requestUser";
import { validateAlertChannelType } from "../../../helpers/planLimits";

export class AlertChannelController {
  static async list(req: Request, res: Response) {
    try {
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const channels = await AlertChannel.find({ userId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: channels });
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

      const { type, name, config } = req.body;
      const validation = await validateAlertChannelType(userId, type);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      const channel = await AlertChannel.create({ userId, type, name, config, isActive: true });
      return res.status(201).json({ success: true, data: channel });
    } catch {
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

      const channel = await AlertChannel.findOne({ _id: req.params.id, userId });
      if (!channel) return res.status(404).json({ success: false, message: "Channel not found" });

      if (req.body.name !== undefined) channel.name = req.body.name;
      if (req.body.config !== undefined) channel.config = req.body.config;
      if (req.body.isActive !== undefined) channel.isActive = req.body.isActive;

      await channel.save();
      return res.status(200).json({ success: true, data: channel });
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

      const channel = await AlertChannel.findOneAndDelete({ _id: req.params.id, userId });
      if (!channel) return res.status(404).json({ success: false, message: "Channel not found" });

      return res.status(200).json({ success: true, message: "Channel deleted" });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async test(req: Request, res: Response) {
    try {
      if (isViewer(req)) {
        return res.status(403).json({ success: false, message: "View-only access" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const channel = await AlertChannel.findOne({ _id: req.params.id, userId });
      if (!channel) return res.status(404).json({ success: false, message: "Channel not found" });

      if (!channel.isActive) {
        return res.status(400).json({ success: false, message: "Channel is inactive" });
      }

      const { sendAlert, getAlertSendErrorMessage } = await import("../../../helpers/alertSender");
      await sendAlert(channel, {
        monitorName: "Test Monitor",
        status: "UP",
        event: "down",
        timestamp: new Date().toISOString(),
        responseTimeMs: 123,
        isTest: true,
      });

      return res.status(200).json({ success: true, message: "Test notification sent" });
    } catch (error) {
      const { getAlertSendErrorMessage } = await import("../../../helpers/alertSender");
      console.error(JSON.stringify({
        level: "error",
        message: "Alert test failed",
        channelId: req.params.id,
        error: error instanceof Error ? error.message : "unknown",
      }));
      return res.status(500).json({
        success: false,
        message: getAlertSendErrorMessage(error),
      });
    }
  }
}
