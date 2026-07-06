import "./env";
import { Queue, Worker, Job } from "bullmq";
import {
  Monitor,
  Check,
  Incident,
  MaintenanceWindow,
  MonitorDoc,
} from "./models";
import { runCheckWithRetry } from "./checkRunner";
import { dispatchMonitorAlerts } from "./dispatchAlerts";

const connection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  maxRetriesPerRequest: null,
};

export const CHECK_QUEUE = "monitor-checks";
export const ALERT_QUEUE = "monitor-alerts";

export const checkQueue = new Queue(CHECK_QUEUE, { connection });
export const alertQueue = new Queue(ALERT_QUEUE, { connection });

const scheduledJobs = new Map<string, string>();
const scheduledIntervals = new Map<string, number>();

async function isInMaintenance(monitorId: string): Promise<boolean> {
  const now = new Date();
  const window = await MaintenanceWindow.findOne({
    monitorId,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  });
  return !!window;
}

async function processCheck(job: Job<{ monitorId: string }>): Promise<void> {
  try {
    const monitor = await Monitor.findById(job.data.monitorId);
    if (!monitor || !monitor.isActive) return;

    const result = await runCheckWithRetry({
      type: monitor.type,
      url: monitor.url ?? undefined,
      host: monitor.host ?? undefined,
      port: monitor.port ?? undefined,
      keyword: monitor.keyword ?? undefined,
      keywordType: monitor.keywordType ?? undefined,
      dnsRecordType: monitor.dnsRecordType ?? undefined,
      dnsExpectedValue: monitor.dnsExpectedValue ?? undefined,
      sslAlertDaysBefore: monitor.sslAlertDaysBefore ?? undefined,
      timeoutSeconds: monitor.timeoutSeconds,
    });

    await Check.create({
      monitorId: monitor._id,
      status: result.status,
      responseTimeMs: result.responseTimeMs,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
      metadata: result.metadata ?? null,
      checkedAt: new Date(),
    });

    const previousStatus = monitor.currentStatus;
    monitor.lastCheckedAt = new Date();
    monitor.currentStatus = result.status;
    await monitor.save();

    const inMaintenance = await isInMaintenance(monitor._id.toString());
    if (inMaintenance) return;

    if (result.status === "DOWN" && (previousStatus === "UP" || previousStatus === "PENDING")) {
      await Incident.create({
        monitorId: monitor._id,
        startedAt: new Date(),
        cause: result.errorMessage,
      });
      await dispatchMonitorAlerts(monitor._id.toString(), "down", {
        responseTimeMs: result.responseTimeMs,
        errorMessage: result.errorMessage,
      });
    } else if (result.status === "UP" && previousStatus === "DOWN") {
      const openIncident = await Incident.findOne({ monitorId: monitor._id, resolvedAt: null });
      if (openIncident) {
        const resolvedAt = new Date();
        openIncident.resolvedAt = resolvedAt;
        openIncident.durationSeconds = Math.floor(
          (resolvedAt.getTime() - openIncident.startedAt.getTime()) / 1000
        );
        await openIncident.save();
      }
      await dispatchMonitorAlerts(monitor._id.toString(), "recovered", {
        responseTimeMs: result.responseTimeMs,
      });
    }
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      message: "Check processing failed",
      monitorId: job.data.monitorId,
      error: error instanceof Error ? error.message : "unknown",
    }));
    throw error;
  }
}

async function processAlert(job: Job<{
  monitorId: string;
  event: "down" | "recovered";
  responseTimeMs?: number;
  errorMessage?: string | null;
}>): Promise<void> {
  await dispatchMonitorAlerts(job.data.monitorId, job.data.event, {
    responseTimeMs: job.data.responseTimeMs,
    errorMessage: job.data.errorMessage,
  });
}

export function startWorkers(): void {
  new Worker(CHECK_QUEUE, processCheck, { connection, concurrency: 10 });
  new Worker(ALERT_QUEUE, processAlert, { connection, concurrency: 5 });
  console.log(JSON.stringify({ level: "info", message: "Workers started" }));
}

export async function scheduleMonitor(
  monitor: MonitorDoc & { intervalSeconds: number; isActive: boolean },
  options: { immediate?: boolean } = {}
): Promise<void> {
  const monitorId = monitor._id.toString();

  if (!monitor.isActive) {
    await unscheduleMonitor(monitorId);
    return;
  }

  const existingInterval = scheduledIntervals.get(monitorId);
  if (existingInterval === monitor.intervalSeconds && scheduledJobs.has(monitorId)) {
    return;
  }

  const existing = scheduledJobs.get(monitorId);
  if (existing) {
    await checkQueue.removeRepeatableByKey(existing);
    scheduledJobs.delete(monitorId);
    scheduledIntervals.delete(monitorId);
  }

  await checkQueue.add(
    "check",
    { monitorId },
    {
      repeat: { every: monitor.intervalSeconds * 1000, jobId: `repeat-${monitorId}` },
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  if (options.immediate !== false) {
    await checkQueue.add("check", { monitorId }, { removeOnComplete: true });
  }

  const repeatableJobs = await checkQueue.getRepeatableJobs();
  const job = repeatableJobs.find((j) => j.id === `repeat-${monitorId}`);
  if (job) {
    scheduledJobs.set(monitorId, job.key);
    scheduledIntervals.set(monitorId, monitor.intervalSeconds);
  }
}

export async function unscheduleMonitor(monitorId: string): Promise<void> {
  const key = scheduledJobs.get(monitorId);
  if (key) {
    await checkQueue.removeRepeatableByKey(key);
    scheduledJobs.delete(monitorId);
    scheduledIntervals.delete(monitorId);
  }
}

export async function syncMonitors(): Promise<void> {
  const monitors = await Monitor.find({ isActive: true });
  const activeIds = new Set(monitors.map((m) => m._id.toString()));

  for (const monitor of monitors) {
    const monitorId = monitor._id.toString();
    const isNew = !scheduledJobs.has(monitorId);
    await scheduleMonitor(
      monitor as unknown as MonitorDoc & { intervalSeconds: number; isActive: boolean },
      { immediate: isNew }
    );
  }

  for (const [monitorId] of scheduledJobs) {
    if (!activeIds.has(monitorId)) {
      await unscheduleMonitor(monitorId);
    }
  }
}

export async function startScheduler(): Promise<void> {
  await syncMonitors();
  // Run immediate checks once on startup for all active monitors
  const monitors = await Monitor.find({ isActive: true });
  for (const monitor of monitors) {
    await checkQueue.add("check", { monitorId: monitor._id.toString() }, { removeOnComplete: true });
  }
  setInterval(() => {
    syncMonitors().catch((err) =>
      console.error(JSON.stringify({ level: "error", message: "Sync failed", error: err.message }))
    );
  }, 60000);
  console.log(JSON.stringify({ level: "info", message: "Scheduler started" }));
}
