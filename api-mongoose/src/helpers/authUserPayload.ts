import TeamMember from "../Features/teamMembers/schema/teamMember.schema";
import { toObjectId } from "./requestUser";

interface AuthUserShape {
  id: string;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  workspaceOwnerId: string;
  teamRole: string;
}

export async function buildAuthUserPayload(user: {
  _id: unknown;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
}): Promise<AuthUserShape> {
  const userId = String(user._id);
  const membership = await TeamMember.findOne({
    memberUserId: toObjectId(userId),
    status: "ACTIVE",
  }).sort({ updatedAt: -1 });

  return {
    id: userId,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    workspaceOwnerId: membership ? String(membership.userId) : userId,
    teamRole: membership ? membership.role : "OWNER",
  };
}
