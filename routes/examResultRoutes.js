import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  saveExamResult,
  getMyExamHistory,
  getExamResultById,
} from "../controllers/examResultController.js";

const router = express.Router();

router.post("/save",         protect, saveExamResult);
router.get("/my",            protect, getMyExamHistory);
router.get("/:resultId",     protect, getExamResultById);

export default router;