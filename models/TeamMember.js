import mongoose from "mongoose";

/* ══════════════════════════════════════════════════════════════
   TeamMember — Individual team cards in §3
   Photo upload + social links + toggle
══════════════════════════════════════════════════════════════ */
const teamMemberSchema = new mongoose.Schema(
  {
    photo:        { type: String, default: "" },  // uploaded file path
    name:         { type: String, required: [true, "Name is required"],  trim: true },
    role:         { type: String, required: [true, "Role is required"],  trim: true },
    bio:          { type: String, required: [true, "Bio is required"],   trim: true },
    linkedin:     { type: String, default: "", trim: true },
    twitter:      { type: String, default: "", trim: true },
    email:        { type: String, default: "", trim: true },
    displayOrder: { type: Number, default: 0 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

teamMemberSchema.index({ displayOrder: 1 });

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);
export default TeamMember;