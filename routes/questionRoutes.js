import express from "express";
import {
  getAllQuestions, getQuestionById, createQuestion,
  updateQuestion, deleteQuestion, toggleStatus,
  getExamQuestions, submitExam, getStats,
} from "../controllers/questionController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── PUBLIC ROUTES (token nahi chahiye) ───────────────────────
router.get("/exam",    getExamQuestions);
router.post("/submit", submitExam);

// ─── ADMIN ROUTES (protect + adminOnly) ───────────────────────
router.get("/stats",   protect, adminOnly, getStats);
router.route("/")
  .get(protect, adminOnly, getAllQuestions)
  .post(protect, adminOnly, createQuestion);

router.route("/:id")
  .get(protect, adminOnly, getQuestionById)
  .put(protect, adminOnly, updateQuestion)
  .delete(protect, adminOnly, deleteQuestion);

router.patch("/:id/toggle", protect, adminOnly, toggleStatus);

export default router;