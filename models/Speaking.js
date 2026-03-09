import mongoose from "mongoose";

const speakingSchema = new mongoose.Schema(
  {
    title:           { type: String, required: true, trim: true },
    description:     { type: String, default: "" },
    audioUrl:        { type: String, default: "" },
    questionText:    { type: String, required: true },
    expectedPattern: { type: String, default: "" },  // ✅ Optional
    level:           { type: String, enum: ["A1","A2","B1","B2","C1","C2"], default: "A1" },
    language:        { type: String, default: "English" },
    duration:        { type: Number, default: 0 },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Speaking", speakingSchema);