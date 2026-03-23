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

// PUBLIC
router.get("/success-stories",     getAllStories);
router.get("/success-stories/:id", getStoryById);

// ADMIN
router.get(   "/admin/success-stories",            protect, adminOnly, adminGetAllStories);
router.get(   "/admin/success-stories/:id",        protect, adminOnly, getStoryById);        // ✅ YE ADD KARO
router.post(  "/admin/success-stories",            protect, adminOnly, createStory);
router.put(   "/admin/success-stories/:id",        protect, adminOnly, updateStory);
router.delete("/admin/success-stories/:id",        protect, adminOnly, deleteStory);
router.patch( "/admin/success-stories/:id/toggle", protect, adminOnly, toggleStoryStatus);

export default router;