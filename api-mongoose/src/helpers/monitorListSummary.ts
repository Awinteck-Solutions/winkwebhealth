import mongoose from "mongoose";
import Check from "../Features/monitors/schema/check.schema";

const SUMMARY_HOURS = 24;
const MAX_RECENT_CHECKS = 96;

export interface MonitorListSummary {
  uptimePercent: number | null;
  recentChecks: { status: string; checkedAt: Date }[];
}

/** Batch 24h uptime + mini-bar checks for all monitors in two aggregation queries. */
export async function buildMonitorListSummaries(
  monitorIds: mongoose.Types.ObjectId[]
): Promise<Map<string, MonitorListSummary>> {
  const result = new Map<string, MonitorListSummary>();
  if (!monitorIds.length) return result;

  const since = new Date(Date.now() - SUMMARY_HOURS * 60 * 60 * 1000);

  const [uptimeAgg, checksAgg] = await Promise.all([
    Check.aggregate([
      { $match: { monitorId: { $in: monitorIds }, checkedAt: { $gte: since } } },
      {
        $group: {
          _id: "$monitorId",
          total: { $sum: 1 },
          up: { $sum: { $cond: [{ $eq: ["$status", "UP"] }, 1, 0] } },
        },
      },
    ]),
    Check.aggregate([
      { $match: { monitorId: { $in: monitorIds }, checkedAt: { $gte: since } } },
      { $sort: { monitorId: 1, checkedAt: 1 } },
      {
        $group: {
          _id: "$monitorId",
          checks: { $push: { status: "$status", checkedAt: "$checkedAt" } },
        },
      },
      { $project: { checks: { $slice: ["$checks", -MAX_RECENT_CHECKS] } } },
    ]),
  ]);

  for (const id of monitorIds) {
    result.set(String(id), { uptimePercent: null, recentChecks: [] });
  }

  for (const row of uptimeAgg as { _id: mongoose.Types.ObjectId; total: number; up: number }[]) {
    const key = String(row._id);
    const entry = result.get(key);
    if (!entry) continue;
    entry.uptimePercent =
      row.total > 0 ? Math.round((row.up / row.total) * 10000) / 100 : 100;
  }

  for (const row of checksAgg as { _id: mongoose.Types.ObjectId; checks: { status: string; checkedAt: Date }[] }[]) {
    const key = String(row._id);
    const entry = result.get(key);
    if (!entry) continue;
    entry.recentChecks = row.checks;
  }

  return result;
}

export function summariesToRecord(
  map: Map<string, MonitorListSummary>
): Record<string, MonitorListSummary> {
  const record: Record<string, MonitorListSummary> = {};
  map.forEach((summary, id) => {
    record[id] = summary;
  });
  return record;
}
