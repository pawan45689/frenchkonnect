import mongoose from "mongoose";

const demoVideoSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      default: null,
    },
    videoType: {
      type: String,
      enum: ["upload", "url"],
      default: "upload",
    },
    title: {
      type: String,
      default: "Platform Demo",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("DemoVideo", demoVideoSchema);