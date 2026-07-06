import { Request, Response } from "express";
import TeamMember from "../schema/teamMember.schema";
import User from "../../auth/schema/user.schema";
import { getUserId, toObjectId } from "../../../helpers/requestUser";
import { sendTeamInviteEmail, getMailErrorMessage } from "../../../helpers/mailer";
import { generateInviteToken, inviteExpiry } from "./teamInvite.controller";
import { validateTeamInviteAllowed } from "../../../helpers/planLimits";

async function sendInvite(member: InstanceType<typeof TeamMember>, ownerId: string) {
  const owner = await User.findById(ownerId).select("firstname lastname email");
  const inviterName = owner?.firstname
    ? `${owner.firstname}${owner.lastname ? ` ${owner.lastname}` : ""}`
    : owner?.email || "Your team admin";

  member.inviteToken = generateInviteToken();
  member.inviteExpiresAt = inviteExpiry();
  member.status = "PENDING";
  await member.save();

  await sendTeamInviteEmail(member.email, member.name, inviterName, member.inviteToken, member.role);
}

export class TeamMemberController {
  static async list(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const members = await TeamMember.find({ userId: toObjectId(userId) }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: members });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { name, email, phone, role } = req.body;
      if (!name?.trim() || !email?.trim()) {
        return res.status(400).json({ success: false, message: "Name and email are required" });
      }

      const inviteValidation = await validateTeamInviteAllowed(userId);
      if (!inviteValidation.valid) {
        return res.status(400).json({ success: false, message: inviteValidation.message });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && String(existingUser._id) === userId) {
        return res.status(400).json({ success: false, message: "You cannot invite yourself" });
      }

      const member = await TeamMember.create({
        userId: toObjectId(userId),
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        role: role || "MEMBER",
        status: "PENDING",
        inviteToken: generateInviteToken(),
        inviteExpiresAt: inviteExpiry(),
      });

      try {
        await sendInvite(member, userId);
      } catch (mailErr) {
        await TeamMember.findByIdAndDelete(member._id);
        return res.status(502).json({
          success: false,
          message: getMailErrorMessage(mailErr),
        });
      }

      return res.status(201).json({
        success: true,
        data: member,
        message: "Invitation email sent",
      });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error && error.code === 11000) {
        return res.status(400).json({ success: false, message: "A team member with this email already exists" });
      }
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const member = await TeamMember.findOne({ _id: req.params.id, userId: toObjectId(userId) });
      if (!member) return res.status(404).json({ success: false, message: "Team member not found" });

      if (req.body.name !== undefined) member.name = req.body.name.trim();
      if (req.body.phone !== undefined) member.phone = req.body.phone?.trim() || null;
      if (req.body.role !== undefined) member.role = req.body.role;
      if (req.body.status !== undefined && member.status !== "PENDING") {
        member.status = req.body.status;
      }

      await member.save();
      return res.status(200).json({ success: true, data: member });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async resendInvite(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const member = await TeamMember.findOne({ _id: req.params.id, userId: toObjectId(userId) });
      if (!member) return res.status(404).json({ success: false, message: "Team member not found" });
      if (member.status !== "PENDING") {
        return res.status(400).json({ success: false, message: "Only pending invitations can be resent" });
      }

      try {
        await sendInvite(member, userId);
      } catch (mailErr) {
        return res.status(502).json({ success: false, message: getMailErrorMessage(mailErr) });
      }

      return res.status(200).json({ success: true, message: "Invitation resent", data: member });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const member = await TeamMember.findOneAndDelete({ _id: req.params.id, userId: toObjectId(userId) });
      if (!member) return res.status(404).json({ success: false, message: "Team member not found" });

      return res.status(200).json({ success: true, message: "Team member removed" });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }
}
