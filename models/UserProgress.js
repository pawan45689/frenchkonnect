import mongoose from "mongoose";

const UserProgressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lesson_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    section_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    level_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* Ek user ek lesson ek baar hi complete kar sakta hai */
UserProgressSchema.index({ user_id: 1, lesson_id: 1 }, { unique: true });

export default mongoose.model("UserProgress", UserProgressSchema);