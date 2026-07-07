import { NextFunction, Request, Response } from "express";
import { isSuperAdminEmail } from "../helpers/superAdmin";

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  const email = req.currentUser?.email;
  if (!email) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  if (!isSuperAdminEmail(email)) {
    res.status(403).json({ success: false, message: "Forbidden — super admin access required" });
    return;
  }
  next();
}
