import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: ""
    },
    favicon: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    // ✅ Social Media Fields
    facebook: {
      type: String,
      default: "",
      trim: true
    },
    twitter: {
      type: String,
      default: "",
      trim: true
    },
    instagram: {
      type: String,
      default: "",
      trim: true
    },
    linkedin: {
      type: String,
      default: "",
      trim: true
    },
    youtube: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);