import express from "express";
import {
  createSpeaking, getAllSpeakingAdmin, getSpeakingByIdAdmin,
  updateSpeaking, deleteSpeaking,
  getAllSpeakingPublic, getSpeakingById, checkAnswer,
} from "../controllers/speakingController.js";

const router = express.Router();

// PUBLIC
router.get ("/speaking",           getAllSpeakingPublic);
router.get ("/speaking/:id",       getSpeakingById);
router.post("/speaking/:id/check", checkAnswer);

// ADMIN
router.post  ("/admin/speaking",      createSpeaking);
router.get   ("/admin/speaking",      getAllSpeakingAdmin);
router.get   ("/admin/speaking/:id",  getSpeakingByIdAdmin);
router.put   ("/admin/speaking/:id",  updateSpeaking);
router.delete("/admin/speaking/:id",  deleteSpeaking);

export default router;