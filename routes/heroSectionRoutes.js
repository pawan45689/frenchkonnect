import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getHeroSection,
  getHeroAdmin,
  updateHeroSection,
} from "../controllers/heroSectionController.js";

const router = express.Router();

// Public
router.get("/", getHeroSection);

// Admin
router.get("/admin",  protect, adminOnly, getHeroAdmin);
router.put("/admin",  protect, adminOnly, updateHeroSection);

export default router;