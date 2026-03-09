// models/Audio.js
import mongoose from "mongoose";

const cueSchema = new mongoose.Schema({
  start: { type: Number, required: true },  // seconds
  end:   { type: Number, required: true },  // seconds
  text:  { type: String, required: true },  // jo bola ja raha hai
}, { _id: false });

const audioSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    audioUrl:    { type: String, required: true },
    duration:    { type: Number, default: 0 },
    language:    { type: String, default: "French" },
    level:       { type: String, enum: ["A1","A2","B1","B2","C1","C2"], default: "A1" },
    isActive:    { type: Boolean, default: true },
    cues:        { type: [cueSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Audio", audioSchema);