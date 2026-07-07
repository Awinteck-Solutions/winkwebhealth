import { NextFunction, Request, Response } from "express";
import { getUserId } from "../helpers/requestUser";
import { userCanAccessWorkspace, resolveWorkspaceRole } from "../helpers/workspaceService";

export async function attachWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const headerWorkspace = req.headers["x-workspace-id"] as string | undefined;
    const workspaceOwnerId = headerWorkspace?.trim() || userId;

    const allowed = await userCanAccessWorkspace(userId, workspaceOwnerId);
    if (!allowed) {
      res.status(403).json({ success: false, message: "You do not have access to this workspace" });
      return;
    }

    req.workspaceOwnerId = workspaceOwnerId;
    req.teamRole = await resolveWorkspaceRole(userId, workspaceOwnerId);

    next();
  } catch {
    res.status(500).json({ success: false, message: "System error" });
  }
}
