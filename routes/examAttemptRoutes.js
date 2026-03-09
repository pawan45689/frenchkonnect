import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  saveAttempt,
  getUserAttempts,
  getAttemptSummary,
  deleteAttempt,
  getAdminStats,
} from "../controllers/examAttemptController.js";

const router = express.Router();

router.post  ("/",            protect,            saveAttempt);       // POST   /api/v1/exam-attempts
router.get   ("/",            protect,            getUserAttempts);   // GET    /api/v1/exam-attempts
router.get   ("/summary",     protect,            getAttemptSummary); // GET    /api/v1/exam-attempts/summary
router.get   ("/admin/stats", protect, adminOnly, getAdminStats);     // GET    /api/v1/exam-attempts/admin/stats
router.delete("/:id",         protect,            deleteAttempt);     // DELETE /api/v1/exam-attempts/:id

export default router;