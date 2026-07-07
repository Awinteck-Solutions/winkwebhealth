import mongoose from "mongoose";
import Check from "../Features/monitors/schema/check.schema";

export const CHECK_QUERY = {
  MAX_DAYS: 30,
  MAX_HOURS: 30 * 24,
  MIN_HOURS: 0.5,
  MAX_LIMIT: 2000,
  /** Enough for 24h at 1-minute intervals */
  DEFAULT_LIMIT_ONE_DAY: 1440,
} as const;

export function resolveCheckQuery(
  daysRaw?: unknown,
  limitRaw?: unknown,
  hoursRaw?: unknown
) {
  let hours: number;

  if (hoursRaw != null && String(hoursRaw).trim() !== "") {
    const parsed = parseFloat(String(hoursRaw));
    hours = Math.min(
      Math.max(Number.isFinite(parsed) ? parsed : 1, CHECK_QUERY.MIN_HOURS),
      CHECK_QUERY.MAX_HOURS
    );
  } else {
    const daysParsed = parseInt(String(daysRaw ?? "1"), 10);
    const days = Math.min(
      Math.max(Number.isFinite(daysParsed) ? daysParsed : 1, 1),
      CHECK_QUERY.MAX_DAYS
    );
    hours = days * 24;
  }

  const autoLimit = Math.min(
    CHECK_QUERY.MAX_LIMIT,
    Math.max(Math.ceil(hours * 60), 30)
  );
  const limitParsed = limitRaw != null ? parseInt(String(limitRaw), 10) : NaN;
  const limit = Number.isFinite(limitParsed)
    ? Math.min(Math.max(limitParsed, 1), CHECK_QUERY.MAX_LIMIT)
    : autoLimit;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return { hours, limit, since };
}

export type PeriodStats = { uptimePercent: number; totalChecks: number };

/** Uptime stats for 1d / 7d / 30d in a single aggregation ($facet). */
export async function buildMonitorPeriodStats(
  monitorId: mongoose.Types.ObjectId,
  periods: number[] = [1, 7, 30]
): Promise<Record<string, PeriodStats>> {
  const facet: Record<string, mongoose.PipelineStage[]> = {};

  for (const days of periods) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    facet[`${days}d`] = [
      { $match: { checkedAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          up: { $sum: { $cond: [{ $eq: ["$status", "UP"] }, 1, 0] } },
        },
      },
    ];
  }

  const [result] = await Check.aggregate([{ $match: { monitorId } }, { $facet: facet }]);

  const stats: Record<string, PeriodStats> = {};
  for (const days of periods) {
    const key = `${days}d`;
    const row = (result?.[key] as { total?: number; up?: number }[] | undefined)?.[0];
    const total = row?.total ?? 0;
    const up = row?.up ?? 0;
    stats[key] = {
      uptimePercent: total > 0 ? Math.round((up / total) * 10000) / 100 : 100,
      totalChecks: total,
    };
  }

  return stats;
}
