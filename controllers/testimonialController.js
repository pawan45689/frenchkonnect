import Testimonial from '../models/Testimonial.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// GET ALL TESTIMONIALS (For Admin Panel)
// ==========================================
export const getAllTestimonials = async (req, res) => {
  try {
    const { status, limit, sort } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    let sortOptions = {};
    if (sort) {
      const sortFields = sort.split(',');
      sortFields.forEach(field => {
        if (field.startsWith('-')) {
          sortOptions[field.substring(1)] = -1;
        } else {
          sortOptions[field] = 1;
        }
      });
    } else {
      // Default sort by createdAt (latest first)
      sortOptions = { createdAt: -1 };
    }
    
    let testimonials = Testimonial.find(query).sort(sortOptions);
    
    if (limit) {
      testimonials = testimonials.limit(parseInt(limit));
    }
    
    const results = await testimonials;
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Get All Testimonials Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching testimonials',
      error: error.message
    });
  }
};

// ==========================================
// GET SINGLE TESTIMONIAL BY ID
// ==========================================
export const getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    console.error('Get Testimonial Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching testimonial',
      error: error.message
    });
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
      const sortFields = sort.split(',');
      sortFields.forEach(field => {
        if (field.startsWith('-')) {
          sortOptions[field.substring(1)] = -1;
        } else {
          sortOptions[field] = 1;
        }
      });
    } else {
      // Default sort by createdAt (latest first)
      sortOptions = { createdAt: -1 };
    }
    
    let query = Testimonial.find({ status: 'active' }).sort(sortOptions);
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const results = await query;
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Get Active Testimonials Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active testimonials',
      error: error.message
    });
  }
};

// ==========================================
// CREATE NEW TESTIMONIAL (With Image Upload)
// ==========================================
export const createTestimonial = async (req, res) => {
  try {
    const { name, position, description, rating, status } = req.body;
    
    if (!name || !position || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, position, and description'
      });
    }
    
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }
    
    const imageFile = req.files.image;
    const imageName = `testimonial_${Date.now()}${path.extname(imageFile.name)}`;
    const imagePath = path.join(__dirname, '../uploads/testimonials', imageName);
    
    const uploadsDir = path.join(__dirname, '../uploads/testimonials');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    await imageFile.mv(imagePath);
    
    const newTestimonial = await Testimonial.create({
      name,
      position,
      image: imageName,
      description,
      rating: rating || 5,
      status: status || 'active'
    });
    
    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: newTestimonial
    });
  } catch (error) {
    console.error('Create Testimonial Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating testimonial',
      error: error.message
    });
  }
};

// ==========================================
// UPDATE TESTIMONIAL (With Optional Image Upload)
// ==========================================
export const updateTestimonial = async (req, res) => {
  try {
    const { name, position, description, rating, status } = req.body;
    
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }
    
    if (name) testimonial.name = name;
    if (position) testimonial.position = position;
    if (description) testimonial.description = description;
    if (rating) testimonial.rating = rating;
    if (status) testimonial.status = status;
    
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const imageName = `testimonial_${Date.now()}${path.extname(imageFile.name)}`;
      const imagePath = path.join(__dirname, '../uploads/testimonials', imageName);
      
      if (testimonial.image) {
        const oldImagePath = path.join(__dirname, '../uploads/testimonials', testimonial.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      await imageFile.mv(imagePath);
      testimonial.image = imageName;
    }
    
    await testimonial.save();
    
    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      data: testimonial
    });
  } catch (error) {
    console.error('Update Testimonial Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating testimonial',
      error: error.message
    });
  }
};

// ==========================================
// DELETE TESTIMONIAL (With Image Deletion)
// ==========================================
export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }
    
    if (testimonial.image) {
      const imagePath = path.join(__dirname, '../uploads/testimonials', testimonial.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Testimonial.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete Testimonial Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting testimonial',
      error: error.message
    });
  }
};

// ==========================================
// TOGGLE TESTIMONIAL STATUS (active <-> inactive)
// ==========================================
export const toggleTestimonialStatus = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }
    
    testimonial.status = testimonial.status === 'active' ? 'inactive' : 'active';
    await testimonial.save();
    
    res.status(200).json({
      success: true,
      message: `Testimonial status changed to ${testimonial.status}`,
      data: testimonial
    });
  } catch (error) {
    console.error('Toggle Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling testimonial status',
      error: error.message
    });
  }
};

// ==========================================
// BULK CREATE TESTIMONIALS
// ==========================================
export const bulkCreateTestimonials = async (req, res) => {
  try {
    const { testimonials } = req.body;
    
    if (!Array.isArray(testimonials) || testimonials.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of testimonials'
      });
    }
    
    const createdTestimonials = await Testimonial.insertMany(testimonials);
    
    res.status(201).json({
      success: true,
      message: `${createdTestimonials.length} testimonials created successfully`,
      data: createdTestimonials
    });
  } catch (error) {
    console.error('Bulk Create Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating testimonials',
      error: error.message
    });
  }
};