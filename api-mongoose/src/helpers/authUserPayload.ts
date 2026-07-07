import TeamMember from "../Features/teamMembers/schema/teamMember.schema";
import { toObjectId } from "./requestUser";
import { ensureDefaultWorkspace, listWorkspacesForUser, WorkspaceSummary } from "./workspaceService";

interface AuthUserShape {
  id: string;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  workspaceOwnerId: string;
  teamRole: string;
  workspaces: WorkspaceSummary[];
}

export async function buildAuthUserPayload(
  user: {
    _id: unknown;
    email: string;
    firstname?: string | null;
    lastname?: string | null;
  },
  preferredWorkspaceOwnerId?: string
): Promise<AuthUserShape> {
  const userId = String(user._id);
  await ensureDefaultWorkspace(user);
  const workspaces = await listWorkspacesForUser(userId);

  let workspaceOwnerId = preferredWorkspaceOwnerId || userId;
  const hasAccess = workspaces.some((w) => w.ownerId === workspaceOwnerId);
  if (!hasAccess) {
    workspaceOwnerId = workspaces[0]?.ownerId || userId;
  }

  const active = workspaces.find((w) => w.ownerId === workspaceOwnerId);
  const teamRole = active?.role || "OWNER";

  return {
    id: userId,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    workspaceOwnerId,
    teamRole,
    workspaces,
  };
}

/** @deprecated use listWorkspacesForUser — kept for migrations */
export async function getLatestMembership(userId: string) {
  return TeamMember.findOne({
    memberUserId: toObjectId(userId),
    status: "ACTIVE",
  }).sort({ updatedAt: -1 });
}
