import express from "express";
import {
  createCheckoutSession,
  verifyPayment,
  stripeWebhook,
  getMySubscription,
  cancelSubscription,
  getAllTransactions,
} from "../controllers/paymentController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Stripe Webhook (NO auth, raw body handled in server.js) ───────────────────
router.post("/webhook", stripeWebhook);

// ── User Routes ───────────────────────────────────────────────────────────────
router.post("/create-checkout",  protect, createCheckoutSession);
router.get("/verify",            protect, verifyPayment);
router.get("/my-subscription",   protect, getMySubscription);
router.post("/cancel",           protect, cancelSubscription);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get("/admin/all-transactions", protect, adminOnly, getAllTransactions);

export default router;