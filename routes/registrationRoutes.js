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
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ── PUBLIC — Login required ──────────────────────────────── */
router.post("/registrations", protect, createRegistration); // ✅ protect add kiya

/* ── ADMIN ───────────────────────────────────────────────── */
router.get   ("/admin/registrations/stats",           protect, adminOnly, getRegistrationStats);
router.get   ("/admin/registrations",                 protect, adminOnly, getAllRegistrations);
router.get   ("/admin/registrations/:id",             protect, adminOnly, getRegistrationById);
router.get   ("/admin/events/:eventId/registrations", protect, adminOnly, getRegistrationsByEvent);
router.put   ("/admin/registrations/:id/status",      protect, adminOnly, updateRegistrationStatus);
router.delete("/admin/registrations/:id",             protect, adminOnly, deleteRegistration);

export default router;