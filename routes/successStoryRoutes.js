import express from "express";
import {
  getAllStories,
  getStoryById,
  adminGetAllStories,
  createStory,
  updateStory,
  deleteStory,
  toggleStoryStatus,
} from "../controllers/successStoryController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────
router.get("/success-stories",      getAllStories);   // sabhi active stories
router.get("/success-stories/:id",  getStoryById);    // single story

// ─────────────────────────────────────────────
// ADMIN ROUTES  (verifyToken + isAdmin)
// ─────────────────────────────────────────────
router.get(    "/admin/success-stories",              protect, adminOnly, adminGetAllStories);
router.post(   "/admin/success-stories",              protect, adminOnly, createStory);
router.put(    "/admin/success-stories/:id",          protect, adminOnly, updateStory);
router.delete( "/admin/success-stories/:id",          protect, adminOnly, deleteStory);
router.patch(  "/admin/success-stories/:id/toggle",   protect, adminOnly, toggleStoryStatus);

export default router;