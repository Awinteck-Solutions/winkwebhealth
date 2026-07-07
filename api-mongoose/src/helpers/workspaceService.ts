import Workspace from "../Features/workspaces/schema/workspace.schema";
import TeamMember from "../Features/teamMembers/schema/teamMember.schema";
import User from "../Features/auth/schema/user.schema";
import { toObjectId } from "./requestUser";

export interface WorkspaceSummary {
  ownerId: string;
  name: string;
  slug: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  isOwn: boolean;
  ownerName: string;
  ownerEmail: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "workspace";
}

function displayName(user: { firstname?: string | null; lastname?: string | null; email: string }): string {
  const full = [user.firstname, user.lastname].filter(Boolean).join(" ").trim();
  return full || user.email.split("@")[0];
}

export async function ensureDefaultWorkspace(user: {
  _id: unknown;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
}): Promise<void> {
  const ownerId = toObjectId(String(user._id));
  const exists = await Workspace.findOne({ ownerId });
  if (exists) return;

  const baseName = displayName(user);
  const name = `${baseName}'s workspace`;
  let slug = slugify(baseName);
  let attempt = 0;
  while (await Workspace.findOne({ slug })) {
    attempt++;
    slug = `${slugify(baseName)}-${attempt}`;
  }

  await Workspace.create({ ownerId, name, slug });
}

export async function listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]> {
  const user = await User.findById(userId);
  if (!user) return [];
  await ensureDefaultWorkspace(user);
  const own = await Workspace.findOne({ ownerId: toObjectId(userId) }).lean();
  const memberships = await TeamMember.find({
    memberUserId: toObjectId(userId),
    status: "ACTIVE",
  }).lean();

  const ownerIdSet = new Set(memberships.map((m) => String(m.userId)));
  if (own) ownerIdSet.add(userId);
  const ownerIds = Array.from(ownerIdSet);

  const ownerWorkspaces = await Workspace.find({ ownerId: { $in: ownerIds.map(toObjectId) } }).lean();
  const ownerMap = new Map(ownerWorkspaces.map((w) => [String(w.ownerId), w]));

  const owners = await User.find({ _id: { $in: ownerIds.map(toObjectId) } })
    .select("firstname lastname email")
    .lean();
  const ownerUserMap = new Map(owners.map((o) => [String(o._id), o]));

  const results: WorkspaceSummary[] = [];

  if (own) {
    results.push({
      ownerId: String(own.ownerId),
      name: own.name,
      slug: own.slug,
      role: "OWNER",
      isOwn: true,
      ownerName: displayName(user),
      ownerEmail: user.email,
    });
  }

  for (const m of memberships) {
    const ownerId = String(m.userId);
    if (ownerId === userId) continue;
    const ws = ownerMap.get(ownerId);
    const owner = ownerUserMap.get(ownerId) as { firstname?: string | null; lastname?: string | null; email: string } | undefined;
    results.push({
      ownerId,
      name: ws?.name || "Team workspace",
      slug: ws?.slug || ownerId.slice(-6),
      role: m.role as WorkspaceSummary["role"],
      isOwn: false,
      ownerName: owner ? displayName(owner) : "Team owner",
      ownerEmail: owner?.email || "",
    });
  }

  return results;
}

export async function userCanAccessWorkspace(userId: string, workspaceOwnerId: string): Promise<boolean> {
  if (userId === workspaceOwnerId) return true;
  const membership = await TeamMember.findOne({
    memberUserId: toObjectId(userId),
    userId: toObjectId(workspaceOwnerId),
    status: "ACTIVE",
  });
  return !!membership;
}

export async function resolveWorkspaceRole(
  userId: string,
  workspaceOwnerId: string
): Promise<WorkspaceSummary["role"]> {
  if (userId === workspaceOwnerId) return "OWNER";
  const membership = await TeamMember.findOne({
    memberUserId: toObjectId(userId),
    userId: toObjectId(workspaceOwnerId),
    status: "ACTIVE",
  });
  return (membership?.role as WorkspaceSummary["role"]) || "VIEWER";
}
