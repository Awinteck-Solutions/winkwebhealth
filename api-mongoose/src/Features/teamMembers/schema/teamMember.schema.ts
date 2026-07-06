const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const teamMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: null },
    role: {
      type: String,
      enum: ["ADMIN", "MEMBER", "VIEWER"],
      default: "MEMBER",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "INACTIVE"],
      default: "PENDING",
    },
    inviteToken: { type: String, default: null, index: true, sparse: true },
    inviteExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

teamMemberSchema.index({ userId: 1, email: 1 }, { unique: true });

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);

export default TeamMember;
