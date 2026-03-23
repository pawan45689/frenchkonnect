import express from "express";
import {
  createContact, getAllContacts,
  getContactById, deleteContact,
  getContactStats, markAsRead   // ✅ markAsRead import karo
} from "../controllers/contactController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public ──────────────────────────────────────────
router.post("/", createContact);

// ── Admin ────────────────────────────────────────────
router.get("/all",         protect, adminOnly, getAllContacts);
router.get("/stats",       protect, adminOnly, getContactStats);
router.get("/:id",         protect, adminOnly, getContactById);
router.delete("/:id",      protect, adminOnly, deleteContact);
router.patch("/:id/read",  protect, adminOnly, markAsRead);  // ✅ NEW

export default router;