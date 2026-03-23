// models/examGuideModel.js
import mongoose from "mongoose";

const examGuideCardSchema = new mongoose.Schema({
  examType: {
    type: String,
    enum: ["tcf", "tef", "delf"],
    required: true,
  },
  icon: { type: String, default: "📋" }, // emoji ya Cloudinary image URL
  title: { type: String, required: true },
  description: { type: String, required: true },
  items: [{ type: String }],
  order: { type: Number, default: 0 }, // cards ki ordering ke liye
}, { timestamps: true });

const clbRowSchema = new mongoose.Schema({
  examType: {
    type: String,
    enum: ["tcf", "tef", "delf"],
    required: true,
  },
  clb: { type: String, required: true },   // "CLB 7"
  tefScore: { type: String },              // "310–348"
  tcfScore: { type: String },              // "421–449"
  delfLevel: { type: String },             // DELF ke liye "B2"
  cefr: { type: String, required: true },  // "B2"
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const ExamGuideCard = mongoose.model("ExamGuideCard", examGuideCardSchema);
export const ClbRow = mongoose.model("ClbRow", clbRowSchema);