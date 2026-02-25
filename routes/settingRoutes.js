import express from "express";
import { getSettings, updateSettings } from "../controllers/settingController.js";

const router = express.Router();

// Get settings
router.get("/", getSettings);

// Update settings
router.post("/", updateSettings);

export default router;