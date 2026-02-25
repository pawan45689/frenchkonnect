import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  deleteContact,
  getContactStats
} from "../controllers/contactController.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post("/", createContact);

// ==========================================
// ADMIN ROUTES
// ==========================================
router.get("/all", getAllContacts);
router.get("/stats", getContactStats);
router.get("/:id", getContactById);
router.delete("/:id", deleteContact);

export default router;