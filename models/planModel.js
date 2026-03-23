import mongoose from "mongoose";

const compareFeaturesSchema = new mongoose.Schema(
  {
    feature: { type: String, required: true, trim: true },
    basic:   { type: String, default: null,  trim: true },
    combo:   { type: String, required: true, trim: true },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    planKey: {
      type: String, required: true, unique: true,
      trim: true, lowercase: true,
      enum: ["tef", "tcf", "combo"],
    },
    name:            { type: String,  required: true, trim: true },
    description:     { type: String,  required: true, trim: true },
    monthlyPrice:    { type: Number,  required: true, min: 0 },
    annualPrice:     { type: Number,  required: true, min: 0 },
    icon:            { type: String,  required: true, trim: true },
    iconColor:       { type: String,  required: true, default: "#135bec" },
    iconBg:          { type: String,  required: true, default: "rgba(19,91,236,0.10)" },
    featured:        { type: Boolean, default: false },
    badge:           { type: String,  default: null, trim: true },
    features:        { type: [String], default: [] },
    notIncluded:     { type: [String], default: [] },
    compareFeatures: { type: [compareFeaturesSchema], default: [] },

    isActive:        { type: Boolean, default: true },
    order:           { type: Number,  default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);