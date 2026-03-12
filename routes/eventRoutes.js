import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventStatus,
  getPublicEvents,
  getPublicEventById,
} from "../controllers/eventController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ── PUBLIC (no protection needed) ──────────────────────── */
router.get("/events",     getPublicEvents);
router.get("/events/:id", getPublicEventById);

/* ── ADMIN (protected) ───────────────────────────────────── */


router.get   ("/admin/events",            protect, adminOnly, getAllEvents);
router.get   ("/admin/events/:id",        protect, adminOnly, getEventById);
router.post  ("/admin/events",            protect, adminOnly, createEvent);
router.put   ("/admin/events/:id",        protect, adminOnly, updateEvent);
router.delete("/admin/events/:id",        protect, adminOnly, deleteEvent);
router.patch ("/admin/events/:id/toggle", protect, adminOnly, toggleEventStatus);

export default router;
