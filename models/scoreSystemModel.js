// models/scoreSystemModel.js
import mongoose from "mongoose";

// Slider max scores (Reading, Listening, Writing, Speaking)
const sliderConfigSchema = new mongoose.Schema({
  examType: {
    type: String,
    enum: ["tcf", "tef", "delf"],
    required: true,
  },
  skill: {
    type: String,
    enum: ["Reading", "Listening", "Writing", "Speaking"],
    required: true,
  },
  icon: { type: String },       // emoji
  maxScore: { type: Number, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Score breakdown cards
const scoreBreakdownSchema = new mongoose.Schema({
  examType: {
    type: String,
    enum: ["tcf", "tef", "delf"],
    required: true,
  },
  icon: { type: String },         // emoji ya Cloudinary URL
  title: { type: String, required: true },
  range: { type: String },        // "0 – 300 (TEF)"
  description: { type: String },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const SliderConfig = mongoose.model("SliderConfig", sliderConfigSchema);
export const ScoreBreakdown = mongoose.model("ScoreBreakdown", scoreBreakdownSchema);