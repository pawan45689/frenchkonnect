import express from "express";
import {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  toggleNewsStatus,
  uploadNewsFile,

  getPublicNews,
  getPublicNewsById,
} from "../controllers/newsController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public Routes ──────────────────────────────────────────────────
router.get("/public",          getPublicNews);
router.get("/public/:id",      getPublicNewsById);

// ── Admin Routes ───────────────────────────────────────────────────
router.get("/",                protect, adminOnly, getAllNews);


router.post("/upload-file",    protect, adminOnly, uploadNewsFile);
router.post("/",               protect, adminOnly, createNews);

// /:id wale routes BAAD mein
router.get("/:id",             protect, adminOnly, getNewsById);
router.put("/:id",             protect, adminOnly, updateNews);
router.patch("/:id/toggle",    protect, adminOnly, toggleNewsStatus);
router.delete("/:id",          protect, adminOnly, deleteNews);

export default router;