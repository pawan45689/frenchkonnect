import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    level_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
    sectionName: {
      type: String,
      required: [true, "Section name is required"],
      trim: true,
      // No enum — admin can name sections anything
    },
    displayOrder: {
      type: Number,
      required: true,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Section", sectionSchema);