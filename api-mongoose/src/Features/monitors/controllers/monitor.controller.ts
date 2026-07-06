import { Request, Response } from "express";
import Monitor from "../schema/monitor.schema";
import Check from "../schema/check.schema";
import Incident from "../../incidents/schema/incident.schema";
import AlertChannel from "../../alertChannels/schema/alertChannel.schema";
import { getWorkspaceOwnerId, toObjectId, isViewer } from "../../../helpers/requestUser";
import { validateMonitorLimits } from "../../../helpers/planLimits";
import { sendAlert, getAlertSendErrorMessage } from "../../../helpers/alertSender";
import { normalizeMonitorHostFields } from "../../../helpers/monitorInput";

export class MonitorController {
  static async list(req: Request, res: Response) {
    try {
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const monitors = await Monitor.find({ userId: toObjectId(userId) }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: monitors });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async getOne(req: Request, res: Response) {
    try {
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const monitor = await Monitor.findOne({ _id: req.params.id, userId: toObjectId(userId) });
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });

      return res.status(200).json({ success: true, data: monitor });
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

      const {
        name,
        type,
        url,
        host,
        port,
        keyword,
        keywordType,
        dnsRecordType,
        dnsExpectedValue,
        sslAlertDaysBefore,
        intervalSeconds = 300,
        timeoutSeconds = 30,
        alertChannelIds = [],
      } = req.body;

      const validation = await validateMonitorLimits(userId, intervalSeconds, {
        monitorType: type,
        alertChannelIds,
      });
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      const normalizedHost = normalizeMonitorHostFields({ type, host, port });

      const monitor = await Monitor.create({
        userId: toObjectId(userId),
        name,
        type,
        url,
        host: normalizedHost.host,
        port: normalizedHost.port,
        keyword,
        keywordType,
        dnsRecordType,
        dnsExpectedValue,
        sslAlertDaysBefore,
        intervalSeconds,
        timeoutSeconds,
        alertChannelIds,
        currentStatus: "PENDING",
        isActive: true,
      });

      return res.status(201).json({ success: true, data: monitor });
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

      const monitor = await Monitor.findOne({ _id: req.params.id, userId: toObjectId(userId) });
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });

      const intervalSeconds = req.body.intervalSeconds ?? monitor.intervalSeconds;
      const monitorType = req.body.type ?? monitor.type;
      const alertChannelIds = req.body.alertChannelIds ?? monitor.alertChannelIds;
      const validation = await validateMonitorLimits(userId, intervalSeconds, {
        excludeMonitorId: req.params.id,
        monitorType,
        alertChannelIds: Array.isArray(alertChannelIds) ? alertChannelIds.map(String) : [],
      });
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      const allowed = [
        "name",
        "type",
        "url",
        "host",
        "port",
        "keyword",
        "keywordType",
        "dnsRecordType",
        "dnsExpectedValue",
        "sslAlertDaysBefore",
        "intervalSeconds",
        "timeoutSeconds",
        "isActive",
        "alertChannelIds",
      ];
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          monitor[key] = req.body[key];
        }
      }

      const normalizedHost = normalizeMonitorHostFields({
        type: monitor.type,
        host: monitor.host,
        port: monitor.port,
      });
      monitor.host = normalizedHost.host ?? monitor.host;
      if (normalizedHost.port != null) monitor.port = normalizedHost.port;

      if (req.body.isActive === false) monitor.currentStatus = "PAUSED";
      else if (req.body.isActive === true && monitor.currentStatus === "PAUSED") {
        monitor.currentStatus = "PENDING";
      }

      await monitor.save();
      return res.status(200).json({ success: true, data: monitor });
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

      const monitor = await Monitor.findOneAndDelete({ _id: req.params.id, userId: toObjectId(userId) });
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });

      return res.status(200).json({ success: true, message: "Monitor deleted" });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async getChecks(req: Request, res: Response) {
    try {
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const monitor = await Monitor.findOne({ _id: req.params.id, userId: toObjectId(userId) });
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });

      const days = parseInt(req.query.days as string) || 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const checks = await Check.find({
        monitorId: monitor._id,
        checkedAt: { $gte: since },
      })
        .sort({ checkedAt: -1 })
        .limit(5000);

      return res.status(200).json({ success: true, data: checks });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const monitor = await Monitor.findOne({ _id: req.params.id, userId: toObjectId(userId) });
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });

      const periods = [1, 7, 30];
      const stats: Record<string, { uptimePercent: number; totalChecks: number }> = {};

      for (const days of periods) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const checks = await Check.find({
          monitorId: monitor._id,
          checkedAt: { $gte: since },
        });
        const total = checks.length;
        const up = checks.filter((c) => c.status === "UP").length;
        stats[`${days}d`] = {
          uptimePercent: total > 0 ? Math.round((up / total) * 10000) / 100 : 100,
          totalChecks: total,
        };
      }

      const incidents = await Incident.find({ monitorId: monitor._id })
        .sort({ startedAt: -1 })
        .limit(50);

      return res.status(200).json({ success: true, data: { stats, incidents } });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async testAlerts(req: Request, res: Response) {
    try {
      if (isViewer(req)) {
        return res.status(403).json({ success: false, message: "View-only access" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const monitor = await Monitor.findOne({ _id: req.params.id, userId: toObjectId(userId) });
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });

      const channelIds = monitor.alertChannelIds || [];
      if (!channelIds.length) {
        return res.status(400).json({ success: false, message: "No alert channels linked to this monitor" });
      }

      const channels = await AlertChannel.find({
        _id: { $in: channelIds },
        userId: toObjectId(userId),
        isActive: true,
      });

      if (!channels.length) {
        return res.status(400).json({ success: false, message: "No active alert channels found" });
      }

      const payload = {
        monitorName: monitor.name,
        status: "UP" as const,
        event: "down" as const,
        timestamp: new Date().toISOString(),
        responseTimeMs: 123,
        isTest: true,
      };

      const results = await Promise.allSettled(
        channels.map((channel) => sendAlert(channel, payload))
      );
      const sent = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - sent;

      if (sent === 0) {
        const firstError = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
        return res.status(500).json({
          success: false,
          message: firstError
            ? getAlertSendErrorMessage(firstError.reason)
            : "Failed to send test notifications",
        });
      }

      return res.status(200).json({
        success: true,
        message: `Test notification sent to ${sent} channel${sent === 1 ? "" : "s"}${failed ? ` (${failed} failed)` : ""}`,
        data: { sent, failed },
      });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }
}
