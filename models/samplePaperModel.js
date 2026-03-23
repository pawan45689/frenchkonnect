// models/samplePaperModel.js
import mongoose from "mongoose";

const samplePaperSchema = new mongoose.Schema({
  examType: {
    type: String,
    enum: ["tcf", "tef", "delf"],
    required: true,
  },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },      // Cloudinary PDF URL
  publicId: { type: String, required: true },     // Cloudinary public_id (delete ke liye)
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const SamplePaper = mongoose.model("SamplePaper", samplePaperSchema);