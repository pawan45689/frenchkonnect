import mongoose from "mongoose";

const featureCardSchema = new mongoose.Schema({
  icon:        { type: String, default: "" },
  title:       { type: String, default: "" },
  description: { type: String, default: "" },
  isActive:    { type: Boolean, default: true },
}, { _id: false });

const statSchema = new mongoose.Schema({
  value: { type: String, default: "" },
  label: { type: String, default: "" },
}, { _id: false });

const heroSectionSchema = new mongoose.Schema(
  {
    heading:          { type: String, default: "" },
    description:      { type: String, default: "" },
    image:            { type: String, default: "" },
    badgeText:        { type: String, default: "" },
    primaryBtnText:   { type: String, default: "" },
    primaryBtnLink:   { type: String, default: "" },
    secondaryBtnText: { type: String, default: "" },
    secondaryBtnLink: { type: String, default: "" },
    stats:            { type: [statSchema],       default: [] },
    featureCards:     { type: [featureCardSchema], default: [] },
    eventDay:         { type: String,  default: "" },
    eventMonth:       { type: String,  default: "" },
    eventTitle:       { type: String,  default: "" },
    eventDescription: { type: String,  default: "" },
    eventBtnText:     { type: String,  default: "" },
    eventBtnLink:     { type: String,  default: "" },
    eventCountdown:   { type: String,  default: "" },
    showEvent:        { type: Boolean, default: true },
    isActive:         { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("HeroSection", heroSectionSchema);