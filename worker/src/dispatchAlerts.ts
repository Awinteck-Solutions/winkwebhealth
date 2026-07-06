import { Types } from "mongoose";
import { Monitor, AlertChannel } from "./models";
import { sendAlert } from "./alertSender";

export async function dispatchMonitorAlerts(
  monitorId: string,
  event: "down" | "recovered",
  details: { responseTimeMs?: number; errorMessage?: string | null } = {},
): Promise<{ sent: number; failed: number }> {
  const monitor = await Monitor.findById(monitorId);
  if (!monitor) {
    console.warn(JSON.stringify({
      level: "warn",
      message: "Monitor not found for alert dispatch",
      monitorId,
      event,
    }));
    return { sent: 0, failed: 0 };
  }

  const channelIds = (monitor.alertChannelIds || []).map((id) => new Types.ObjectId(String(id)));
  if (!channelIds.length) {
    console.warn(JSON.stringify({
      level: "warn",
      message: "No alert channels linked to monitor — skipping notification",
      monitorId: monitor._id.toString(),
      monitorName: monitor.name,
      event,
    }));
    return { sent: 0, failed: 0 };
  }

  const channels = await AlertChannel.find({
    _id: { $in: channelIds },
    isActive: true,
  });

  if (!channels.length) {
    console.warn(JSON.stringify({
      level: "warn",
      message: "No active alert channels found for linked IDs",
      monitorId: monitor._id.toString(),
      monitorName: monitor.name,
      event,
      linkedChannelCount: channelIds.length,
    }));
    return { sent: 0, failed: 0 };
  }

  const payload = {
    monitorName: monitor.name,
    status: event === "down" ? "DOWN" as const : "UP" as const,
    event,
    timestamp: new Date().toISOString(),
    responseTimeMs: details.responseTimeMs,
    errorMessage: details.errorMessage,
  };

  let sent = 0;
  let failed = 0;

  for (const channel of channels) {
    try {
      await sendAlert(channel, payload);
      sent += 1;
      console.log(JSON.stringify({
        level: "info",
        message: "Alert sent",
        monitorId: monitor._id.toString(),
        monitorName: monitor.name,
        event,
        channelId: channel._id.toString(),
        channelType: channel.type,
      }));
    } catch (error) {
      failed += 1;
      console.error(JSON.stringify({
        level: "error",
        message: "Alert send failed",
        monitorId: monitor._id.toString(),
        monitorName: monitor.name,
        event,
        channelId: channel._id.toString(),
        channelType: channel.type,
        error: error instanceof Error ? error.message : "unknown",
      }));
    }
  }

  return { sent, failed };
}
