import mongoose from "mongoose";

const successStorySchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Image is required"],
    },
    story: {
      type: String,
      required: [true, "Story is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const SuccessStory = mongoose.model("SuccessStory", successStorySchema);
export default SuccessStory;