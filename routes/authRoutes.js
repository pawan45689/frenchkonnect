import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  signupController, loginController, googleAuthController,
  sendPasswordResetOTP, verifyResetOTP, resetPasswordController,
  logoutController, getAllUsers, getUserById, deleteUser,
  updateUser, getUserStats,getCurrentUser, updateProfileController,   // ← NEW
  uploadAvatarController,
} from "../controllers/authController.js";

const router = express.Router();

// ── Public Routes ──────────────────────────────────────────────
router.post("/signup",          signupController);
router.post("/login",           loginController);
router.post("/google-auth",     googleAuthController);
router.post("/forgot-password", sendPasswordResetOTP);
router.post("/verify-otp",      verifyResetOTP);
router.post("/reset-password",  resetPasswordController);
router.post("/logout",          logoutController);

// ── Admin Routes — specific PEHLE, /:id BAAD MEIN ─────────────
router.get("/all",   protect, adminOnly, getAllUsers);
router.get("/stats", protect, adminOnly, getUserStats);
router.get("/me",    protect, getCurrentUser);  
router.put( "/update-profile", protect, updateProfileController);  // ← NEW
router.post("/upload-avatar",  protect, uploadAvatarController); 
// /:id routes — SABSE BAAD MEIN
router.get("/:id",    protect, adminOnly, getUserById);
router.put("/:id",    protect, adminOnly, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;