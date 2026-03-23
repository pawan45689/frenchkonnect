import express from "express";
import {
  getActivePlans,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "../controllers/planController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────
router.get("/", getActivePlans);

// ── Admin ─────────────────────────────────────────────
router.get   ("/admin/all",  protect, adminOnly, getAllPlans);
router.post  ("/admin",      protect, adminOnly, createPlan);
router.put   ("/admin/:id",  protect, adminOnly, updatePlan);
router.delete("/admin/:id",  protect, adminOnly, deletePlan);

export default router;