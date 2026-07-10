import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { encrypt } from "../../../helpers/tokenizer";
import User from "../schema/user.schema";
import getRandomInt from "../../../helpers/random";
import { sendPasswordResetEmail, getMailErrorMessage } from "../../../helpers/mailer";
import { buildAuthUserPayload } from "../../../helpers/authUserPayload";

const RESET_HOURS = 1;

function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive email lookup (handles legacy mixed-case accounts). */
async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") },
  });
}

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const { firstname, lastname, password } = req.body;
      const email = normalizeEmail(req.body.email);
      if (!email || !password) {
        return res.status(400).json({ status: false, message: "Email and password required" });
      }

      const existing = await findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ status: false, message: "An account with this email already exists" });
      }

      const otp = String(getRandomInt(999, 9999));
      const encryptedPassword = await encrypt.encryptpass(password);

      const user = await User.create({
        firstname,
        lastname,
        email,
        password: encryptedPassword,
        otp,
      });

      const token = encrypt.generateToken({
        id: String(user._id),
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      });

      const profile = await buildAuthUserPayload(user);

      return res.status(201).json({
        status: true,
        message: "New User registered",
        user: {
          ...profile,
          token,
        },
      });
    } catch (error: unknown) {
      console.log("signup error :>> ", error);
      return res.status(400).json({
        status: false,
        message: "Unsuccessful registration",
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { password } = req.body;
      const email = normalizeEmail(req.body.email);
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await findUserByEmail(email);
      if (!user?.password) {
        return res.status(404).json({ status: false, message: "Invalid email or password" });
      }

      const valid = encrypt.comparepassword(user.password, password);
      if (!valid) {
        return res.status(404).json({ status: false, message: "Invalid email or password" });
      }

      // Normalize stored email if it was mixed-case
      if (user.email !== email) {
        user.email = email;
        await user.save();
      }

      const token = encrypt.generateToken({
        id: String(user._id),
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      });

      const profile = await buildAuthUserPayload(user);

      return res.json({
        status: true,
        message: "Login success",
        response: {
          ...profile,
          token,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const email = normalizeEmail(req.body.email);
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      const user = await findUserByEmail(email);
      const genericMessage = "If an account exists for that email, a reset link has been sent.";

      if (user) {
        const resetToken = randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000);
        if (user.email !== email) user.email = email;
        await user.save();

        try {
          const name = user.firstname || user.email.split("@")[0];
          await sendPasswordResetEmail(user.email, name, resetToken);
        } catch (mailErr) {
          user.resetPasswordToken = null;
          user.resetPasswordExpires = null;
          await user.save();
          console.error("[forgotPassword] mail failed:", mailErr);
          return res.status(502).json({
            success: false,
            message: getMailErrorMessage(mailErr),
          });
        }
      }

      return res.status(200).json({ success: true, message: genericMessage });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async validateResetToken(req: Request, res: Response) {
    try {
      const token = String(req.params.token || "").trim();
      if (!token) {
        return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      }).select("email firstname");

      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
      }

      return res.status(200).json({
        success: true,
        data: { email: user.email, firstname: user.firstname },
      });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { password } = req.body;
      const token = String(req.body.token || "").trim();
      if (!token) {
        return res.status(400).json({ success: false, message: "Reset token is required" });
      }
      if (!password || String(password).length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
      }

      user.password = await encrypt.encryptpass(password);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Your password has been reset successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}
