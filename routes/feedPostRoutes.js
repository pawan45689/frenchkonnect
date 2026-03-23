import express from "express";
import {
  getFeedPosts, createFeedPost, toggleLike,
  adminGetFeedPosts, adminDeleteFeedPost, adminTogglePin,getLeaderboard,
} from "../controllers/feedPostController.js";
import { getComments, addComment, deleteComment } from "../controllers/commentController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── PUBLIC ──────────────────────────────────────────────────
router.get("/feed",                                   getFeedPosts);
router.get("/feed/:id/comments",                      getComments);  // ✅
router.get("/community/leaderboard", getLeaderboard);
// ── USER — login required ────────────────────────────────────
router.post  ("/feed",                                protect, createFeedPost);
router.put   ("/feed/:id/like",                       protect, toggleLike);
router.post  ("/feed/:id/comments",                   protect, addComment);    // ✅
router.delete("/feed/:postId/comments/:commentId",    protect, deleteComment); // ✅

// ── ADMIN ────────────────────────────────────────────────────
router.get   ("/admin/feed",         protect, adminOnly, adminGetFeedPosts);
router.delete("/admin/feed/:id",     protect, adminOnly, adminDeleteFeedPost);
router.put   ("/admin/feed/:id/pin", protect, adminOnly, adminTogglePin);

export default router;