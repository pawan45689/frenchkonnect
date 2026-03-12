import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import config from "../config/config.js";

export const protect = async (req, res, next) => {
  try {
    /* Get token — Authorization: Bearer <token> */
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login first — no token found",
      });
    }

    /* Verify — your JWT_SECRET will be used */
    const decoded = JWT.verify(token, config.JWT_SECRET);

    /* Fetch user — excluding password */
    const user = await userModel
      .findById(decoded._id)
      .select("-password -resetPasswordOTP -resetPasswordOTPExpire");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // ← now req.user._id will be available in controller
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token — please login again",
    });
  }
};

/* For admin only routes */
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};