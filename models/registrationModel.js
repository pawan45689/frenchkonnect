import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Event",
      required: true,
    },
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },
    type:  {
      type:    String,
      enum:    ["student", "parent", "teacher", "other"],
      default: "other",
    },
    status: {
      type:    String,
      enum:    ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Registration", registrationSchema);