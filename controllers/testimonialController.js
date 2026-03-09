import Testimonial from '../models/Testimonial.js';
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

/* ── Helper ── */
const uploadPhoto = async (file) => {
  return await uploadToCloudinary(file.data, "testimonials");
};

// ==========================================
// GET ALL TESTIMONIALS (For Admin Panel)
// ==========================================
export const getAllTestimonials = async (req, res) => {
  try {
    const { status, limit, sort } = req.query;

    let query = {};
    if (status) query.status = status;

    let sortOptions = {};
    if (sort) {
      sort.split(',').forEach(field => {
        if (field.startsWith('-')) sortOptions[field.substring(1)] = -1;
        else sortOptions[field] = 1;
      });
    } else {
      sortOptions = { createdAt: -1 };
    }

    let q = Testimonial.find(query).sort(sortOptions);
    if (limit) q = q.limit(parseInt(limit));
    const results = await q;

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching testimonials', error: error.message });
  }
};

// ==========================================
// GET SINGLE TESTIMONIAL BY ID
// ==========================================
export const getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    res.status(200).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching testimonial', error: error.message });
  }
};

// ==========================================
// GET ONLY ACTIVE TESTIMONIALS (For Frontend)
// ==========================================
export const getActiveTestimonials = async (req, res) => {
  try {
    const { limit, sort } = req.query;

    let sortOptions = {};
    if (sort) {
      sort.split(',').forEach(field => {
        if (field.startsWith('-')) sortOptions[field.substring(1)] = -1;
        else sortOptions[field] = 1;
      });
    } else {
      sortOptions = { createdAt: -1 };
    }

    let q = Testimonial.find({ status: 'active' }).sort(sortOptions);
    if (limit) q = q.limit(parseInt(limit));
    const results = await q;

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching active testimonials', error: error.message });
  }
};

// ==========================================
// CREATE NEW TESTIMONIAL
// ==========================================
export const createTestimonial = async (req, res) => {
  try {
    const { name, position, description, rating, status } = req.body;

    if (!name || !position || !description) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields: name, position, and description' });
    }

    if (!req.files?.image) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    // Cloudinary pe upload
    const imageUrl = await uploadPhoto(req.files.image);

    const newTestimonial = await Testimonial.create({
      name,
      position,
      image: imageUrl,   // ab Cloudinary URL save hoga
      description,
      rating: rating || 5,
      status: status || 'active',
    });

    res.status(201).json({ success: true, message: 'Testimonial created successfully', data: newTestimonial });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating testimonial', error: error.message });
  }
};

// ==========================================
// UPDATE TESTIMONIAL
// ==========================================
export const updateTestimonial = async (req, res) => {
  try {
    const { name, position, description, rating, status } = req.body;

    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });

    if (name)        testimonial.name        = name;
    if (position)    testimonial.position    = position;
    if (description) testimonial.description = description;
    if (rating)      testimonial.rating      = rating;
    if (status)      testimonial.status      = status;

    // Nayi image upload ho to purani Cloudinary se delete karo
    if (req.files?.image) {
      await deleteFromCloudinary(testimonial.image);
      testimonial.image = await uploadPhoto(req.files.image);
    }

    await testimonial.save();
    res.status(200).json({ success: true, message: 'Testimonial updated successfully', data: testimonial });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating testimonial', error: error.message });
  }
};

// ==========================================
// DELETE TESTIMONIAL
// ==========================================
export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });

    // Cloudinary se image delete karo
    await deleteFromCloudinary(testimonial.image);

    await Testimonial.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Testimonial deleted successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting testimonial', error: error.message });
  }
};

// ==========================================
// TOGGLE TESTIMONIAL STATUS
// ==========================================
export const toggleTestimonialStatus = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });

    testimonial.status = testimonial.status === 'active' ? 'inactive' : 'active';
    await testimonial.save();

    res.status(200).json({ success: true, message: `Testimonial status changed to ${testimonial.status}`, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling testimonial status', error: error.message });
  }
};

// ==========================================
// BULK CREATE TESTIMONIALS
// ==========================================
export const bulkCreateTestimonials = async (req, res) => {
  try {
    const { testimonials } = req.body;
    if (!Array.isArray(testimonials) || testimonials.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of testimonials' });
    }

    const createdTestimonials = await Testimonial.insertMany(testimonials);
    res.status(201).json({ success: true, message: `${createdTestimonials.length} testimonials created successfully`, data: createdTestimonials });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating testimonials', error: error.message });
  }
};