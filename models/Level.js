import mongoose from "mongoose";

const levelSchema = new mongoose.Schema(
  {
    levelName: {
      type: String,
      required: [true, "Level name is required"],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    bannerImage: {
      type: String,
      default: "",
    },
    whatYouWillLearn: {
      type: [String],
      default: [],
    },
    levelOutcome: {
      type: String,
      required: [true, "Level outcome is required"],
    },
    displayOrder: {
      type: Number,
      required: true,
      default: 1,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    // ✅ NEW: Ye field batata hai kaunsa plan chahiye is level ko access karne ke liye
    planKey: {
      type: String,
      enum: ["tef", "tcf", "combo"],
      default: "tef",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Level", levelSchema);