import mongoose from "mongoose";

const feedPostSchema = new mongoose.Schema(
  {
    text:          { type: String, required: true },
    author:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course:        { type: String, default: "Community" },
    pinned:        { type: Boolean, default: false },
    likes:         [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views:         { type: Number, default: 0 },       // ✅ views
    commentsCount: { type: Number, default: 0 },       // ✅ comments count
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("FeedPost", feedPostSchema);