import express from "express";
import { 
  signupController, 
  loginController,
  googleAuthController, // ✅ NEW - Google Auth
  sendPasswordResetOTP,
  verifyResetOTP,
  resetPasswordController,
  logoutController
} from "../controllers/authController.js";
import {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  getUserStats,
} from "../controllers/authController.js";

const router = express.Router();

// Auth routes
router.post("/signup", signupController);
router.post("/login", loginController);

// ✅ NEW - Google Authentication Route
router.post("/google-auth", googleAuthController);

// Password reset routes (OTP-based)
router.post("/forgot-password", sendPasswordResetOTP);
router.post("/verify-otp", verifyResetOTP);
router.post("/reset-password", resetPasswordController);
router.get("/all", getAllUsers);
router.get("/stats", getUserStats);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
// Logout
router.post("/logout", logoutController);

export default router;