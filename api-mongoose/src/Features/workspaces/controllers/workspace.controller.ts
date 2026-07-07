import { Request, Response } from "express";
import { getUserId } from "../../../helpers/requestUser";
import { listWorkspacesForUser } from "../../../helpers/workspaceService";
import User from "../../auth/schema/user.schema";
import { buildAuthUserPayload } from "../../../helpers/authUserPayload";

export class WorkspaceController {
  static async list(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const workspaces = await listWorkspacesForUser(userId);
      return res.status(200).json({ success: true, data: workspaces });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async switchWorkspace(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const { workspaceOwnerId } = req.body as { workspaceOwnerId?: string };
      if (!workspaceOwnerId) {
        return res.status(400).json({ success: false, message: "workspaceOwnerId required" });
      }
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      const profile = await buildAuthUserPayload(user, workspaceOwnerId);
      return res.status(200).json({ success: true, data: profile });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }
}
