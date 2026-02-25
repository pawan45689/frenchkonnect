import express from 'express';
import {
  getTermsConditions,
  updateTermsConditions
} from '../controllers/termsConditionsController.js';

const router = express.Router();

router.get('/get', getTermsConditions);
router.post('/update', updateTermsConditions);

export default router;