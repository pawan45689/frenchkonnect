// routes/audioRoutes.js
import express from "express";
import {
  createAudio,
  getAllAudioAdmin,
  getAudioByIdAdmin,
  updateAudio,
  deleteAudio,
  transcribeAudioAI,
  getAllAudioPublic,
  getAudioById,
} from "../controllers/audioController.js";

const router = express.Router();

// ── PUBLIC ────────────────────────────────────────────────────
router.get("/audio",     getAllAudioPublic);  // GET  /api/v1/audio
router.get("/audio/:id", getAudioById);       // GET  /api/v1/audio/:id

// ── ADMIN ─────────────────────────────────────────────────────
router.post  ("/admin/audio",                createAudio);        // POST   /api/v1/admin/audio
router.get   ("/admin/audio",                getAllAudioAdmin);    // GET    /api/v1/admin/audio
router.get   ("/admin/audio/:id",            getAudioByIdAdmin);  // GET    /api/v1/admin/audio/:id
router.put   ("/admin/audio/:id",            updateAudio);        // PUT    /api/v1/admin/audio/:id
router.delete("/admin/audio/:id",            deleteAudio);        // DELETE /api/v1/admin/audio/:id
router.post  ("/admin/audio/:id/transcribe", transcribeAudioAI);  // POST   /api/v1/admin/audio/:id/transcribe

export default router;