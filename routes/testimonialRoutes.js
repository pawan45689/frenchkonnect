import express from 'express';
import {
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialStatus,
  bulkCreateTestimonials,
  getActiveTestimonials
} from '../controllers/testimonialController.js';

const router = express.Router();

// Get all testimonials (admin panel)
router.get('/', getAllTestimonials);
// Get only active testimonials (frontend)
router.get('/active', getActiveTestimonials);
// Get single testimonial by ID
router.get('/:id', getTestimonialById);

// Create new testimonial with image upload
router.post('/', createTestimonial);
// Bulk create testimonials
router.post('/bulk', bulkCreateTestimonials);

// Update testimonial (with optional image)
router.put('/:id', updateTestimonial);

// Delete testimonial
router.delete('/:id', deleteTestimonial);

// Toggle status (active/inactive)
router.patch('/:id/toggle', toggleTestimonialStatus);

export default router;