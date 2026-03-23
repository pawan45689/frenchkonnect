import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

router.get("/", protect, getLeaderboard);

export default router;