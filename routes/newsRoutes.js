import express from "express";
import {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  toggleNewsStatus,
  uploadNewsFile,
  downloadSampleTemplate,
  getPublicNews,
  getPublicNewsById,
} from "../controllers/newsController.js";

const router = express.Router();

// ── Public Routes (Website Frontend) ──────────────────────────────
router.get("/public",          getPublicNews);        // list with pagination
router.get("/public/:id",      getPublicNewsById);    // single article detail

// ── Admin Routes ───────────────────────────────────────────────────
router.get("/",                getAllNews);
router.get("/sample-template", downloadSampleTemplate);
router.get("/:id",             getNewsById);
router.post("/",               createNews);
router.post("/upload-file",    uploadNewsFile);
router.put("/:id",             updateNews);
router.patch("/:id/toggle",    toggleNewsStatus);
router.delete("/:id",          deleteNews);

export default router;