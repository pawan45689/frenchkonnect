import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import config from "../config/config.js";

export const protect = async (req, res, next) => {
  try {
    /* Token lo — Authorization: Bearer <token> */
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Login karo pehle — token nahi mila",
      });
    }

    /* Verify — tumhara JWT_SECRET use hoga */
    const decoded = JWT.verify(token, config.JWT_SECRET);

    /* User fetch karo — password chhod ke */
    const user = await userModel
      .findById(decoded._id)
      .select("-password -resetPasswordOTP -resetPasswordOTPExpire");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // ← ab controller mein req.user._id milega
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid ya expired token — dobara login karo",
    });
  }
};

/* Admin only routes ke liye */
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};