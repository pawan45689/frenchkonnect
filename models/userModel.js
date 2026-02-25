import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
    },
    mobile: {
      type: String,
      trim: true,
      default: ""
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"]
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true // ✅ This stays - allows multiple undefined values
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    // OTP fields
    resetPasswordOTP: {
      type: String,
      select: false
    },
    resetPasswordOTPExpire: {
      type: Date,
      select: false
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);