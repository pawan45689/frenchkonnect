import express from "express";
import {
  createContact, getAllContacts,
  getContactById, deleteContact, getContactStats
} from "../controllers/contactController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public ─────────────────────────────────────────────────────
router.post("/", createContact);

// ── Admin (specific routes PEHLE /:id se) ──────────────────────
router.get("/all",    protect, adminOnly, getAllContacts);
router.get("/stats",  protect, adminOnly, getContactStats);
router.get("/:id",    protect, adminOnly, getContactById);
router.delete("/:id", protect, adminOnly, deleteContact);

export default router;