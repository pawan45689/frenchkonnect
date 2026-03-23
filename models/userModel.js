import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    mobile: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: false,
      default: null,
      minlength: [6, "Password must be at least 6 characters"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordOTP: {
      type: String,
      select: false,
    },
    resetPasswordOTPExpire: {
      type: Date,
      select: false,
    },
    username: { type: String, trim: true, default: "" },
    phone:    { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    bio:      { type: String, trim: true, default: "" },
    avatar:   { type: String,             default: "" },

    currentLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      default: null,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastStreakDate: {
      type: Date,
      default: null,
    },
    totalXP: {
      type: Number,
      default: 0,
    },
    dailyXP: {
      type: Number,
      default: 0,
    },
    dailyXPDate: {
      type: Date,
      default: null,
    },
    dailyXPGoal: {
      type: Number,
      default: 500,
    },
    fluencyScore: {
      type: Number,
      default: 0,
    },
    lastAccessedLesson: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Lesson",
  default: null,
},
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);