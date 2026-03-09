import express from "express";
import {
  createRegistration,
  getAllRegistrations,
  getRegistrationById,
  getRegistrationsByEvent,
  updateRegistrationStatus,
  deleteRegistration,
  getRegistrationStats,
} from "../controllers/registrationController.js";

const router = express.Router();

/* ── PUBLIC ──────────────────────────────────────────────── */
// POST /api/v1/registrations  ← frontend form submit
router.post("/registrations", createRegistration);

/* ── ADMIN ───────────────────────────────────────────────── */
// GET  /api/v1/admin/registrations          — all registrations
// GET  /api/v1/admin/registrations/stats    — counts
// GET  /api/v1/admin/registrations/:id      — single
// GET  /api/v1/admin/events/:eventId/registrations  — by event
// PUT  /api/v1/admin/registrations/:id/status       — update status
// DELETE /api/v1/admin/registrations/:id            — delete

router.get   ("/admin/registrations/stats",            getRegistrationStats);
router.get   ("/admin/registrations",                  getAllRegistrations);
router.get   ("/admin/registrations/:id",              getRegistrationById);
router.get   ("/admin/events/:eventId/registrations",  getRegistrationsByEvent);
router.put   ("/admin/registrations/:id/status",       updateRegistrationStatus);
router.delete("/admin/registrations/:id",              deleteRegistration);

export default router;