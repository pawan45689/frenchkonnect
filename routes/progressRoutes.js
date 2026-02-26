import express from "express";
import { completeLesson, getLevelProgress } from "../controllers/progressController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Lesson complete karo */
router.post("/lessons/:lessonId/complete", protect, completeLesson);

/* Level ka progress fetch karo */
router.get("/levels/:levelId/progress", protect, getLevelProgress);

export default router;

/*
  app.js / server.js mein add karo:
  import progressRoutes from "./routes/progressRoutes.js";
  app.use("/api/v1", progressRoutes);
*/