import express from "express";
import {
  getLiveClasses,
  adminGetLiveClasses, adminCreateLiveClass,
  adminUpdateLiveClass, adminDeleteLiveClass, adminToggleLiveClass,
} from "../controllers/liveClassController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── PUBLIC ──────────────────────────────────────────────────
router.get("/live-classes", getLiveClasses);

// ── ADMIN ────────────────────────────────────────────────────
router.get   ("/admin/live-classes",            protect, adminOnly, adminGetLiveClasses);
router.post  ("/admin/live-classes",            protect, adminOnly, adminCreateLiveClass);
router.put   ("/admin/live-classes/:id",        protect, adminOnly, adminUpdateLiveClass);
router.delete("/admin/live-classes/:id",        protect, adminOnly, adminDeleteLiveClass);
router.patch ("/admin/live-classes/:id/toggle", protect, adminOnly, adminToggleLiveClass);

export default router;