export enum Plan {
  FREE = "FREE",
  PRO = "PRO",
}

export type PlanLimitConfig = {
  maxMonitors: number;
  minIntervalSeconds: number;
  allowedMonitorTypes: readonly string[];
  allowedAlertTypes: readonly string[];
  maxStatusPages: number;
  teamInvites: boolean;
  maintenanceWindows: boolean;
};

export const PLAN_LIMITS: Record<Plan, PlanLimitConfig> = {
  [Plan.FREE]: {
    maxMonitors: 3,
    minIntervalSeconds: 300,
    allowedMonitorTypes: ["HTTP"],
    allowedAlertTypes: ["EMAIL"],
    maxStatusPages: 1,
    teamInvites: false,
    maintenanceWindows: false,
  },
  [Plan.PRO]: {
    maxMonitors: 50,
    minIntervalSeconds: 60,
    allowedMonitorTypes: ["HTTP", "KEYWORD", "PORT", "SSL", "DNS"],
    allowedAlertTypes: ["EMAIL", "DISCORD", "SLACK", "WEBHOOK"],
    maxStatusPages: 50,
    teamInvites: true,
    maintenanceWindows: true,
  },
};
