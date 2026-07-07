import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { encrypt } from "../../../helpers/tokenizer";
import User from "../schema/user.schema";
import getRandomInt from "../../../helpers/random";
import { sendPasswordResetEmail, getMailErrorMessage } from "../../../helpers/mailer";
import { buildAuthUserPayload } from "../../../helpers/authUserPayload";

const RESET_HOURS = 1;

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const { firstname, lastname, email, password } = req.body;
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
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await User.findOne({ email });
      if (!user?.password) {
        return res.status(404).json({ status: false, message: "Invalid email or password" });
      }

      const valid = encrypt.comparepassword(user.password, password);
      if (!valid) {
        return res.status(404).json({ status: false, message: "Invalid email or password" });
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
      const { email } = req.body;
      if (!email?.trim()) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      const genericMessage = "If an account exists for that email, a reset link has been sent.";

      if (user) {
        const resetToken = randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000);
        await user.save();

        try {
          const name = user.firstname || user.email.split("@")[0];
          await sendPasswordResetEmail(user.email, name, resetToken);
        } catch (mailErr) {
          user.resetPasswordToken = null;
          user.resetPasswordExpires = null;
          await user.save();
          return res.status(502).json({
            success: false,
            message: getMailErrorMessage(mailErr),
          });
        }
      }

      return res.status(200).json({ success: true, message: genericMessage });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async validateResetToken(req: Request, res: Response) {
    try {
      const user = await User.findOne({
        resetPasswordToken: req.params.token,
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
      const { token, password } = req.body;
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
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
