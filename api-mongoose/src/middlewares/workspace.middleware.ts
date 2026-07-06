import { NextFunction, Request, Response } from "express";
import TeamMember from "../Features/teamMembers/schema/teamMember.schema";
import { getUserId, toObjectId } from "../helpers/requestUser";

export async function attachWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const membership = await TeamMember.findOne({
      memberUserId: toObjectId(userId),
      status: "ACTIVE",
    }).sort({ updatedAt: -1 });

    if (membership) {
      req.workspaceOwnerId = String(membership.userId);
      req.teamRole = membership.role;
    } else {
      req.workspaceOwnerId = userId;
      req.teamRole = "OWNER";
    }

    next();
  } catch {
    res.status(500).json({ success: false, message: "System error" });
  }
}
