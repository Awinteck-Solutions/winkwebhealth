import { Request } from "express";
import mongoose from "mongoose";

interface JwtPayload {
  id?: string;
  _id?: string;
}

export function getUserId(req: Request): string | null {
  const user = req.currentUser as JwtPayload | undefined;
  if (!user) return null;
  const raw = user.id || user._id;
  return raw ? String(raw) : null;
}

export function toObjectId(userId: string) {
  return new mongoose.Types.ObjectId(userId);
}

export function getWorkspaceOwnerId(req: Request): string | null {
  return req.workspaceOwnerId ?? getUserId(req);
}

export type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export function getTeamRole(req: Request): TeamRole {
  const role = req.teamRole;
  if (role === "ADMIN" || role === "MEMBER" || role === "VIEWER") return role;
  return "OWNER";
}

export function isViewer(req: Request): boolean {
  return getTeamRole(req) === "VIEWER";
}
