import express from "express";
import {
  verifyPromoCode,
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from "../controllers/promoController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────
router.post("/verify", verifyPromoCode);

// ── Admin ─────────────────────────────────────────────
router.get   ("/admin",     protect, adminOnly, getAllPromoCodes);
router.post  ("/admin",     protect, adminOnly, createPromoCode);
router.put   ("/admin/:id", protect, adminOnly, updatePromoCode);
router.delete("/admin/:id", protect, adminOnly, deletePromoCode);

export default router;