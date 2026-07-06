import User from "../Features/auth/schema/user.schema";
import Monitor from "../Features/monitors/schema/monitor.schema";
import AlertChannel from "../Features/alertChannels/schema/alertChannel.schema";
import StatusPage from "../Features/statusPages/schema/statusPage.schema";
import { PLAN_LIMITS, Plan, PlanLimitConfig } from "../enums/plan.enum";
import { toObjectId } from "./requestUser";

export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await User.findById(userId);
  return (user?.plan as Plan) || Plan.FREE;
}

export async function getPlanLimitsForUser(userId: string): Promise<PlanLimitConfig> {
  const plan = await getUserPlan(userId);
  return PLAN_LIMITS[plan];
}

export type MonitorLimitOptions = {
  excludeMonitorId?: string;
  monitorType?: string;
  alertChannelIds?: string[];
};

export async function validateMonitorLimits(
  userId: string,
  intervalSeconds: number,
  options: MonitorLimitOptions = {}
): Promise<{ valid: boolean; message?: string }> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  if (options.monitorType && !limits.allowedMonitorTypes.includes(options.monitorType)) {
    return {
      valid: false,
      message: `Free plan supports HTTP monitoring only. Upgrade to Pro for keyword, port, SSL & DNS monitors.`,
    };
  }

  if (intervalSeconds < limits.minIntervalSeconds) {
    return {
      valid: false,
      message: `${plan} plan requires a minimum interval of ${limits.minIntervalSeconds} seconds`,
    };
  }

  const query: Record<string, unknown> = { userId: toObjectId(userId) };
  if (options.excludeMonitorId) {
    query._id = { $ne: options.excludeMonitorId };
  }
  const count = await Monitor.countDocuments(query);

  if (!options.excludeMonitorId && count >= limits.maxMonitors) {
    return {
      valid: false,
      message: `${plan} plan allows a maximum of ${limits.maxMonitors} monitors`,
    };
  }

  if (options.alertChannelIds?.length) {
    const channels = await AlertChannel.find({
      _id: { $in: options.alertChannelIds },
      userId: toObjectId(userId),
    });
    for (const channel of channels) {
      if (!limits.allowedAlertTypes.includes(channel.type)) {
        return {
          valid: false,
          message: `${plan} plan supports email alerts only. Upgrade to Pro for Slack, Discord & webhooks.`,
        };
      }
    }
  }

  return { valid: true };
}

export async function validateAlertChannelType(
  userId: string,
  type: string
): Promise<{ valid: boolean; message?: string }> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  if (!limits.allowedAlertTypes.includes(type)) {
    return {
      valid: false,
      message: `${plan} plan supports email alerts only. Upgrade to Pro for Slack, Discord & webhooks.`,
    };
  }

  return { valid: true };
}

export async function validateStatusPageLimit(
  userId: string
): Promise<{ valid: boolean; message?: string }> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const count = await StatusPage.countDocuments({ userId: toObjectId(userId) });

  if (count >= limits.maxStatusPages) {
    return {
      valid: false,
      message: `${plan} plan allows up to ${limits.maxStatusPages} status page${limits.maxStatusPages === 1 ? "" : "s"}. Upgrade to Pro for more.`,
    };
  }

  return { valid: true };
}

export async function validateTeamInviteAllowed(
  userId: string
): Promise<{ valid: boolean; message?: string }> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  if (!limits.teamInvites) {
    return {
      valid: false,
      message: "Team invites require Pro. Upgrade to collaborate with your team.",
    };
  }

  return { valid: true };
}

export async function validateMaintenanceAllowed(
  userId: string
): Promise<{ valid: boolean; message?: string }> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  if (!limits.maintenanceWindows) {
    return {
      valid: false,
      message: "Maintenance windows require Pro. Upgrade to schedule planned downtime.",
    };
  }

  return { valid: true };
}
