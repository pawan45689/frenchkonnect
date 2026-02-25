import express from 'express';
import {
  getPrivacyPolicy,
  updatePrivacyPolicy,
  getActivePrivacyPolicy
} from '../controllers/privacyPolicyController.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get active privacy policy (for frontend display)
router.get('/active', getActivePrivacyPolicy);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get privacy policy (for admin panel)
router.get('/', getPrivacyPolicy);

// Update privacy policy (creates if doesn't exist)
router.post('/', updatePrivacyPolicy);

export default router;