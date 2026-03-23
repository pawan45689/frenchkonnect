import express from "express";
import multer  from "multer";
import {
  getDemoVideo,
  getAdminDemoVideo,
  uploadDemoVideoFile,
  setDemoVideoUrl,
  deleteDemoVideo,
} from "../controllers/demoVideoController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only video files are allowed"), false);
  },
});

// ── Public ────────────────────────────────────────────
router.get("/", getDemoVideo);

// ── Admin ─────────────────────────────────────────────
router.get   ("/admin",        protect, adminOnly, getAdminDemoVideo);
router.post  ("/admin/upload", protect, adminOnly, upload.single("video"), uploadDemoVideoFile);
router.post  ("/admin/url",    protect, adminOnly, setDemoVideoUrl);
router.delete("/admin",        protect, adminOnly, deleteDemoVideo);

export default router;