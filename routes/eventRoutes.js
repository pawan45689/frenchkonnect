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

const router = express.Router();

/* ── PUBLIC ──────────────────────────────────────────────── */
// GET /api/v1/events
// GET /api/v1/events?category=Sports&page=1&limit=10
router.get("/events", getPublicEvents);

// GET /api/v1/events/:id
router.get("/events/:id", getPublicEventById);

/* ── ADMIN ───────────────────────────────────────────────── */
// GET    /api/v1/admin/events
// GET    /api/v1/admin/events/:id
// POST   /api/v1/admin/events
// PUT    /api/v1/admin/events/:id
// DELETE /api/v1/admin/events/:id
// PATCH  /api/v1/admin/events/:id/toggle

router.get   ("/admin/events",              getAllEvents);
router.get   ("/admin/events/:id",          getEventById);
router.post  ("/admin/events",              createEvent);
router.put   ("/admin/events/:id",          updateEvent);
router.delete("/admin/events/:id",          deleteEvent);
router.patch ("/admin/events/:id/toggle",   toggleEventStatus);

export default router;