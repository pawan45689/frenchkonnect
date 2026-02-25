import mongoose from "mongoose";

const levelSchema = new mongoose.Schema(
  {
    levelName: {
      type: String,
      required: [true, "Level name is required"],
      unique: true,
      trim: true,
      // No enum — admin can enter anything: A1, A2, Teen Basics, Business French etc.
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Level", levelSchema);