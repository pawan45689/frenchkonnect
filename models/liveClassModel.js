import mongoose from "mongoose";

const liveClassSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true },
    host:     { type: String, required: true },
    day:      { type: String, required: true },
    month:    { type: String, required: true },
    time:     { type: String, required: true },
    platform: { type: String, default: "" },
    status:   { type: String, enum: ["upcoming", "completed"], default: "upcoming" },
    isBig:    { type: Boolean, default: false },
    bullets:  [{ type: String }],
    joinUrl:  { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("LiveClass", liveClassSchema);