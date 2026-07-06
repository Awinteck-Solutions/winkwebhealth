import { Request, Response } from "express";
import Stripe = require("stripe");
import User from "../../auth/schema/user.schema";
import { getWorkspaceOwnerId, getTeamRole, isViewer } from "../../../helpers/requestUser";
import { PLAN_LIMITS, Plan } from "../../../enums/plan.enum";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export class BillingController {
  static async getPlan(req: Request, res: Response) {
    try {
      const ownerId = getWorkspaceOwnerId(req);
      if (!ownerId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const user = await User.findById(ownerId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const plan = (user.plan as Plan) || Plan.FREE;

      return res.status(200).json({
        success: true,
        data: {
          plan,
          limits: PLAN_LIMITS[plan],
          stripeCustomerId: user.stripeCustomerId,
          teamRole: getTeamRole(req),
        },
      });
    } catch {
      return res.status(500).json({ success: false, message: "System error" });
    }
  }

  static async createCheckout(req: Request, res: Response) {
    try {
      if (getTeamRole(req) !== "OWNER") {
        return res.status(403).json({ success: false, message: "Only the workspace owner can manage billing" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: user.email });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
        success_url: `${process.env.WEB_URL}/dashboard/billing?success=true`,
        cancel_url: `${process.env.WEB_URL}/dashboard/billing?cancelled=true`,
        metadata: { userId: userId.toString() },
      });

      return res.status(200).json({ success: true, data: { url: session.url } });
    } catch (error) {
      console.error("Checkout error:", error);
      return res.status(500).json({ success: false, message: "Failed to create checkout session" });
    }
  }

  static async createPortal(req: Request, res: Response) {
    try {
      if (getTeamRole(req) !== "OWNER") {
        return res.status(403).json({ success: false, message: "Only the workspace owner can manage billing" });
      }
      const userId = getWorkspaceOwnerId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const user = await User.findById(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ success: false, message: "No billing account found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.WEB_URL}/dashboard/billing`,
      });

      return res.status(200).json({ success: true, data: { url: session.url } });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to create portal session" });
    }
  }

  static async webhook(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).send("Webhook Error");
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.metadata?.userId) {
            await User.findByIdAndUpdate(session.metadata.userId, { plan: Plan.PRO });
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const user = await User.findOne({ stripeCustomerId: customerId });
          if (user) {
            user.plan = subscription.status === "active" ? Plan.PRO : Plan.FREE;
            await user.save();
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          await User.findOneAndUpdate({ stripeCustomerId: customerId }, { plan: Plan.FREE });
          break;
        }
      }
      return res.json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      return res.status(500).json({ success: false });
    }
  }
}
