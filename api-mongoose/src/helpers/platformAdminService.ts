import mongoose from "mongoose";
import User from "../Features/auth/schema/user.schema";
import Workspace from "../Features/workspaces/schema/workspace.schema";
import Monitor from "../Features/monitors/schema/monitor.schema";
import AlertChannel from "../Features/alertChannels/schema/alertChannel.schema";
import StatusPage from "../Features/statusPages/schema/statusPage.schema";
import TeamMember from "../Features/teamMembers/schema/teamMember.schema";
import Subscription from "../Features/billing/schema/subscription.schema";
import Invoice from "../Features/billing/schema/invoice.schema";
import { PRO_AMOUNTS_USD_CENTS } from "../enums/billing.enum";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page || DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(query.limit || DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getPlatformOverview() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    deactivatedUsers,
    freePlan,
    proPlan,
    newUsersWeek,
    totalWorkspaces,
    totalMonitors,
    activeMonitors,
    monitorsByStatus,
    totalAlertChannels,
    totalStatusPages,
    totalTeamMembers,
    activeSubscriptions,
    subscriptionsByStatus,
    paidInvoicesAgg,
    openInvoices,
    recentSignups,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "ACTIVE" }),
    User.countDocuments({ status: "DEACTIVE" }),
    User.countDocuments({ plan: "FREE" }),
    User.countDocuments({ plan: "PRO" }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Workspace.countDocuments(),
    Monitor.countDocuments(),
    Monitor.countDocuments({ isActive: true }),
    Monitor.aggregate([{ $group: { _id: "$currentStatus", count: { $sum: 1 } } }]),
    AlertChannel.countDocuments(),
    StatusPage.countDocuments(),
    TeamMember.countDocuments({ status: "ACTIVE" }),
    Subscription.countDocuments({ status: "active" }),
    Subscription.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Invoice.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, totalUsdCents: { $sum: "$amountCents" }, count: { $sum: 1 } } },
    ]),
    Invoice.countDocuments({ status: "open" }),
    User.find({ createdAt: { $gte: weekAgo } })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("email firstname lastname plan status createdAt")
      .lean(),
  ]);

  const statusMap = Object.fromEntries(monitorsByStatus.map((s: { _id: string; count: number }) => [s._id, s.count]));
  const subStatusMap = Object.fromEntries(
    subscriptionsByStatus.map((s: { _id: string; count: number }) => [s._id, s.count])
  );

  const activeSubs = await Subscription.find({ status: "active" }).select("interval").lean();
  let mrrUsdCents = 0;
  for (const sub of activeSubs) {
    if (sub.interval === "monthly") mrrUsdCents += PRO_AMOUNTS_USD_CENTS.monthly;
    else if (sub.interval === "yearly") mrrUsdCents += Math.round(PRO_AMOUNTS_USD_CENTS.yearly / 12);
  }

  const paidTotal = paidInvoicesAgg[0]?.totalUsdCents ?? 0;
  const paidCount = paidInvoicesAgg[0]?.count ?? 0;

  return {
    users: { total: totalUsers, active: activeUsers, deactivated: deactivatedUsers, newThisWeek: newUsersWeek },
    plans: { free: freePlan, pro: proPlan },
    workspaces: { total: totalWorkspaces },
    monitors: {
      total: totalMonitors,
      active: activeMonitors,
      up: statusMap.UP ?? 0,
      down: statusMap.DOWN ?? 0,
      paused: statusMap.PAUSED ?? 0,
      pending: statusMap.PENDING ?? 0,
    },
    integrations: { alertChannels: totalAlertChannels, statusPages: totalStatusPages, teamMembers: totalTeamMembers },
    billing: {
      activeSubscriptions,
      mrrUsdCents,
      mrrUsd: (mrrUsdCents / 100).toFixed(2),
      totalRevenueUsdCents: paidTotal,
      totalRevenueUsd: (paidTotal / 100).toFixed(2),
      paidInvoices: paidCount,
      openInvoices,
      subscriptionsByStatus: subStatusMap,
    },
    recentSignups,
  };
}

export async function listTenants(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = String(query.search || "").trim();
  const plan = String(query.plan || "").trim();
  const status = String(query.status || "").trim();

  const filter: Record<string, unknown> = {};
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ email: re }, { firstname: re }, { lastname: re }];
  }
  if (plan === "FREE" || plan === "PRO") filter.plan = plan;
  if (status === "ACTIVE" || status === "DEACTIVE") filter.status = status;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const ownerIds = users.map((u) => u._id);
  const [workspaces, monitorCounts, teamCounts, subscriptions] = await Promise.all([
    Workspace.find({ ownerId: { $in: ownerIds } }).lean(),
    Monitor.aggregate([
      { $match: { userId: { $in: ownerIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 }, down: { $sum: { $cond: [{ $eq: ["$currentStatus", "DOWN"] }, 1, 0] } } } },
    ]),
    TeamMember.aggregate([
      { $match: { userId: { $in: ownerIds }, status: "ACTIVE" } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    Subscription.find({ userId: { $in: ownerIds }, status: "active" }).lean(),
  ]);

  const wsByOwner = Object.fromEntries(workspaces.map((w) => [String(w.ownerId), w]));
  const monByOwner = Object.fromEntries(monitorCounts.map((m: { _id: mongoose.Types.ObjectId; count: number; down: number }) => [String(m._id), m]));
  const teamByOwner = Object.fromEntries(teamCounts.map((t: { _id: mongoose.Types.ObjectId; count: number }) => [String(t._id), t.count]));
  const subByOwner = Object.fromEntries(subscriptions.map((s) => [String(s.userId), s]));

  const items = users.map((u) => {
    const id = String(u._id);
    const ws = wsByOwner[id];
    const mon = monByOwner[id];
    const sub = subByOwner[id];
    return {
      id,
      email: u.email,
      firstname: u.firstname,
      lastname: u.lastname,
      status: u.status,
      plan: u.plan,
      createdAt: u.createdAt,
      workspace: ws ? { id: String(ws._id), name: ws.name, slug: ws.slug } : null,
      monitorCount: mon?.count ?? 0,
      monitorsDown: mon?.down ?? 0,
      teamMemberCount: teamByOwner[id] ?? 0,
      subscription: sub
        ? {
            status: sub.status,
            interval: sub.interval,
            provider: sub.provider,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          }
        : null,
    };
  });

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getTenantDetail(userId: string) {
  const user = await User.findById(userId).select("-password -otp -resetPasswordToken").lean();
  if (!user) return null;

  const ownerId = user._id;
  const [workspace, monitors, alertChannels, statusPages, teamMembers, subscription, invoices] = await Promise.all([
    Workspace.findOne({ ownerId }).lean(),
    Monitor.find({ userId: ownerId }).sort({ createdAt: -1 }).lean(),
    AlertChannel.find({ userId: ownerId }).lean(),
    StatusPage.find({ userId: ownerId }).lean(),
    TeamMember.find({ userId: ownerId }).sort({ createdAt: -1 }).lean(),
    Subscription.findOne({ userId: ownerId, status: "active" }).lean(),
    Invoice.find({ userId: ownerId }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  return {
    user: {
      id: String(user._id),
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      status: user.status,
      plan: user.plan,
      stripeCustomerId: user.stripeCustomerId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    workspace: workspace
      ? { id: String(workspace._id), name: workspace.name, slug: workspace.slug, createdAt: workspace.createdAt }
      : null,
    monitors: monitors.map((m) => ({
      id: String(m._id),
      name: m.name,
      type: m.type,
      currentStatus: m.currentStatus,
      isActive: m.isActive,
      url: m.url,
      host: m.host,
      intervalSeconds: m.intervalSeconds,
      lastCheckedAt: m.lastCheckedAt,
      createdAt: m.createdAt,
    })),
    alertChannels: alertChannels.map((a) => ({
      id: String(a._id),
      type: a.type,
      createdAt: a.createdAt,
    })),
    statusPages: statusPages.map((s) => ({
      id: String(s._id),
      slug: s.slug,
      isPublic: s.isPublic,
      createdAt: s.createdAt,
    })),
    teamMembers: teamMembers.map((t) => ({
      id: String(t._id),
      name: t.name,
      email: t.email,
      role: t.role,
      status: t.status,
      createdAt: t.createdAt,
    })),
    subscription: subscription
      ? {
          id: String(subscription._id),
          provider: subscription.provider,
          interval: subscription.interval,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
    invoices: invoices.map((inv) => ({
      id: String(inv._id),
      invoiceNumber: inv.invoiceNumber,
      amountCents: inv.amountCents,
      chargeAmountMinor: inv.chargeAmountMinor,
      chargeCurrency: inv.chargeCurrency,
      status: inv.status,
      interval: inv.interval,
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
    })),
  };
}

export async function updateTenant(userId: string, body: { status?: string; plan?: string }) {
  const updates: Record<string, string> = {};
  if (body.status === "ACTIVE" || body.status === "DEACTIVE") updates.status = body.status;
  if (body.plan === "FREE" || body.plan === "PRO") updates.plan = body.plan;
  if (Object.keys(updates).length === 0) return null;

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true })
    .select("-password -otp")
    .lean();
  return user;
}

export async function listWorkspaces(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = String(query.search || "").trim();

  const searchMatch = search
    ? {
        $match: {
          $or: [
            { name: new RegExp(escapeRegex(search), "i") },
            { slug: new RegExp(escapeRegex(search), "i") },
            { "owner.email": new RegExp(escapeRegex(search), "i") },
          ],
        },
      }
    : null;

  const baseStages: mongoose.PipelineStage[] = [
    {
      $lookup: { from: "users", localField: "ownerId", foreignField: "_id", as: "owner" },
    },
    { $unwind: "$owner" },
    ...(searchMatch ? [searchMatch] : []),
  ];

  const [items, countResult] = await Promise.all([
    Workspace.aggregate([
      ...baseStages,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          id: { $toString: "$_id" },
          name: 1,
          slug: 1,
          createdAt: 1,
          owner: {
            id: { $toString: "$owner._id" },
            email: "$owner.email",
            firstname: "$owner.firstname",
            lastname: "$owner.lastname",
            plan: "$owner.plan",
            status: "$owner.status",
          },
        },
      },
    ]),
    Workspace.aggregate([...baseStages, { $count: "total" }]),
  ]);

  const total = countResult[0]?.total ?? 0;
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function listSubscriptions(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const status = String(query.status || "").trim();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [subs, total] = await Promise.all([
    Subscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subscription.countDocuments(filter),
  ]);

  const userIds = subs.map((s) => s.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("email firstname lastname plan").lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  const items = subs.map((s) => {
    const u = userMap[String(s.userId)];
    return {
      id: String(s._id),
      userId: String(s.userId),
      userEmail: u?.email,
      userName: [u?.firstname, u?.lastname].filter(Boolean).join(" ") || u?.email,
      plan: u?.plan,
      provider: s.provider,
      interval: s.interval,
      status: s.status,
      currentPeriodStart: s.currentPeriodStart,
      currentPeriodEnd: s.currentPeriodEnd,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      createdAt: s.createdAt,
    };
  });

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function listInvoices(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const status = String(query.status || "").trim();

  const filter: Record<string, unknown> = {};
  if (status === "open" || status === "paid" || status === "void") filter.status = status;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);

  const userIds = invoices.map((i) => i.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("email firstname lastname").lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  const items = invoices.map((inv) => {
    const u = userMap[String(inv.userId)];
    return {
      id: String(inv._id),
      invoiceNumber: inv.invoiceNumber,
      userId: String(inv.userId),
      userEmail: u?.email,
      amountCents: inv.amountCents,
      chargeAmountMinor: inv.chargeAmountMinor,
      chargeCurrency: inv.chargeCurrency,
      status: inv.status,
      interval: inv.interval,
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
    };
  });

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function listMonitors(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = String(query.search || "").trim();
  const status = String(query.status || "").trim();

  const filter: Record<string, unknown> = {};
  if (status === "UP" || status === "DOWN" || status === "PAUSED" || status === "PENDING") {
    filter.currentStatus = status;
  }
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: re }, { url: re }, { host: re }];
  }

  const [monitors, total] = await Promise.all([
    Monitor.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Monitor.countDocuments(filter),
  ]);

  const userIds = monitors.map((m) => m.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("email firstname lastname").lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  const items = monitors.map((m) => {
    const u = userMap[String(m.userId)];
    return {
      id: String(m._id),
      name: m.name,
      type: m.type,
      url: m.url,
      host: m.host,
      currentStatus: m.currentStatus,
      isActive: m.isActive,
      intervalSeconds: m.intervalSeconds,
      lastCheckedAt: m.lastCheckedAt,
      userId: String(m.userId),
      userEmail: u?.email,
      createdAt: m.createdAt,
    };
  });

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}
