import { Request, Response } from "express";
import { randomBytes } from "crypto";
import * as jwt from "jsonwebtoken";
import TeamMember from "../schema/teamMember.schema";
import User from "../../auth/schema/user.schema";
import { encrypt } from "../../../helpers/tokenizer";
import getRandomInt from "../../../helpers/random";
import { buildAuthUserPayload } from "../../../helpers/authUserPayload";
import { toObjectId } from "../../../helpers/requestUser";

const INVITE_DAYS = 7;

function inviteExpiry() {
  return new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function emailLookup(email: string) {
  const normalized = normalizeEmail(email);
  return { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
}

async function getSessionUserId(req: Request): Promise<string | null> {
  const header = req.headers.authorization;
  if (!header) return null;
  const token = header.split(" ")[1];
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET) as { id?: string };
    return decode.id ? String(decode.id) : null;
  } catch {
    return null;
  }
}

async function activateMembership(
  member: InstanceType<typeof TeamMember>,
  userId: string,
): Promise<void> {
  const duplicate = await TeamMember.findOne({
    userId: member.userId,
    memberUserId: toObjectId(userId),
    status: "ACTIVE",
    _id: { $ne: member._id },
  });
  if (duplicate) {
    throw new Error("ALREADY_MEMBER");
  }

  member.status = "ACTIVE";
  member.memberUserId = toObjectId(userId);
  member.inviteToken = null;
  member.inviteExpiresAt = null;
  await member.save();
}

async function buildAcceptAuthResponse(
  user: InstanceType<typeof User>,
  member: InstanceType<typeof TeamMember>,
) {
  const profile = await buildAuthUserPayload(user);
  profile.workspaceOwnerId = String(member.userId);
  profile.teamRole = member.role;

  const token = encrypt.generateToken({
    id: profile.id,
    email: profile.email,
    firstname: profile.firstname,
    lastname: profile.lastname,
  });

  return { token, user: profile };
}

export class TeamInviteController {
  static async getInvite(req: Request, res: Response) {
    try {
      const member = await TeamMember.findOne({ inviteToken: req.params.token });
      if (!member) {
        return res.status(404).json({ success: false, message: "Invitation not found or already used" });
      }
      if (member.status !== "PENDING") {
        return res.status(400).json({ success: false, message: "This invitation has already been accepted" });
      }
      if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
        return res.status(400).json({ success: false, message: "This invitation has expired" });
      }

      const owner = await User.findById(member.userId).select("firstname lastname email");
      const inviterName = owner?.firstname
        ? `${owner.firstname}${owner.lastname ? ` ${owner.lastname}` : ""}`
        : owner?.email || "Your team admin";

      const existingUser = await User.findOne({ email: emailLookup(member.email) });
      const inviteEmail = normalizeEmail(member.email);
      const sessionUserId = await getSessionUserId(req);
      const loggedInUser = sessionUserId ? await User.findById(sessionUserId) : null;
      const loggedInEmail = loggedInUser?.email ? normalizeEmail(loggedInUser.email) : null;

      return res.status(200).json({
        success: true,
        data: {
          name: member.name,
          email: member.email,
          role: member.role,
          inviterName,
          expiresAt: member.inviteExpiresAt,
          accountExists: !!existingUser,
          canAcceptWithoutPassword: !!loggedInUser && loggedInEmail === inviteEmail,
          loggedInEmail: loggedInUser?.email || null,
          emailMatchesSession: loggedInEmail === inviteEmail,
        },
      });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async acceptInvite(req: Request, res: Response) {
    try {
      const { password } = req.body ?? {};
      const member = await TeamMember.findOne({ inviteToken: req.params.token });
      if (!member) {
        return res.status(404).json({ success: false, message: "Invitation not found or already used" });
      }
      if (member.status !== "PENDING") {
        return res.status(400).json({ success: false, message: "This invitation has already been accepted" });
      }
      if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
        return res.status(400).json({ success: false, message: "This invitation has expired" });
      }

      const inviteEmail = normalizeEmail(member.email);
      const existingUser = await User.findOne({ email: emailLookup(member.email) });
      const sessionUserId = await getSessionUserId(req);

      if (existingUser) {
        if (sessionUserId && String(existingUser._id) === sessionUserId) {
          try {
            await activateMembership(member, String(existingUser._id));
          } catch (err) {
            if (err instanceof Error && err.message === "ALREADY_MEMBER") {
              return res.status(400).json({ success: false, message: "You are already a member of this workspace" });
            }
            throw err;
          }

          const auth = await buildAcceptAuthResponse(existingUser, member);
          return res.status(200).json({
            success: true,
            message: "Invitation accepted",
            data: auth,
          });
        }

        if (!password || String(password).length < 1) {
          return res.status(400).json({
            success: false,
            message: "Enter your account password to accept this invitation",
          });
        }

        if (!encrypt.comparepassword(existingUser.password, String(password))) {
          return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        try {
          await activateMembership(member, String(existingUser._id));
        } catch (err) {
          if (err instanceof Error && err.message === "ALREADY_MEMBER") {
            return res.status(400).json({ success: false, message: "You are already a member of this workspace" });
          }
          throw err;
        }

        const auth = await buildAcceptAuthResponse(existingUser, member);
        return res.status(200).json({
          success: true,
          message: "Invitation accepted",
          data: auth,
        });
      }

      if (!password || String(password).length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
      }

      const nameParts = member.name.trim().split(/\s+/);
      const firstname = nameParts[0] || member.name;
      const lastname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
      const encryptedPassword = await encrypt.encryptpass(String(password));
      const otp = String(getRandomInt(999, 9999));

      const user = await User.create({
        firstname,
        lastname,
        email: inviteEmail,
        password: encryptedPassword,
        otp,
        status: "ACTIVE",
      });

      await activateMembership(member, String(user._id));
      const auth = await buildAcceptAuthResponse(user, member);

      return res.status(200).json({
        success: true,
        message: "Account created successfully",
        data: auth,
      });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }
}

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export { inviteExpiry };
