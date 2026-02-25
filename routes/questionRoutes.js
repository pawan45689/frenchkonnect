import express from "express";
import {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleStatus,
  getExamQuestions,
  submitExam,
  getStats,
} from "../controllers/questionController.js";

const router = express.Router();

// ─── PUBLIC ROUTES ────────────────────────────────────────────
// GET  /api/v1/questions/exam?level=A1&category=Grammar
router.get("/exam", getExamQuestions);

// POST /api/v1/questions/submit
router.post("/submit", submitExam);

// ─── ADMIN ROUTES ─────────────────────────────────────────────
// GET  /api/v1/questions/stats
router.get("/stats", getStats);

// GET  /api/v1/questions
// POST /api/v1/questions
router.route("/").get(getAllQuestions).post(createQuestion);

// GET    /api/v1/questions/:id
// PUT    /api/v1/questions/:id
// DELETE /api/v1/questions/:id
router.route("/:id").get(getQuestionById).put(updateQuestion).delete(deleteQuestion);

// PATCH /api/v1/questions/:id/toggle
router.patch("/:id/toggle", toggleStatus);

export default router;