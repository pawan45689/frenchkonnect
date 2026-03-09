import SuccessStory from "../models/successStoryModel.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────

/**
 * GET /api/v1/success-stories
 * Sabhi active stories fetch karo (public)
 */
export const getAllStories = async (req, res) => {
  try {
    const stories = await SuccessStory.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: stories.length, data: stories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/success-stories/:id
 * Single story fetch karo (public)
 */
export const getStoryById = async (req, res) => {
  try {
    const story = await SuccessStory.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });
    res.status(200).json({ success: true, data: story });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

/**
 * GET /api/v1/admin/success-stories
 * Sabhi stories fetch karo — active + inactive (admin)
 */
export const adminGetAllStories = async (req, res) => {
  try {
    const stories = await SuccessStory.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: stories.length, data: stories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/admin/success-stories
 * Nayi story create karo — image Cloudinary pe upload hogi
 * Body (multipart/form-data):
 *   - image (file)
 *   - story (string)
 *   - order (number, optional)
 *   - isActive (boolean, optional)
 */
export const createStory = async (req, res) => {
  try {
    const { story, order, isActive } = req.body;

    if (!story) {
      return res.status(400).json({ success: false, message: "Story text is required" });
    }

    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    // Cloudinary pe upload karo
    const imageUrl = await uploadToCloudinary(
      req.files.image.data,
      "success-stories"
    );

    const newStory = await SuccessStory.create({
      image: imageUrl,
      story,
      order: order ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
    });

    res.status(201).json({ success: true, message: "Story created successfully", data: newStory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/v1/admin/success-stories/:id
 * Story update karo — agar nayi image ho toh purani delete, nayi upload
 * Body (multipart/form-data):
 *   - image (file, optional)
 *   - story (string, optional)
 *   - order (number, optional)
 *   - isActive (boolean, optional)
 */
export const updateStory = async (req, res) => {
  try {
    const existing = await SuccessStory.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Story not found" });

    const { story, order, isActive } = req.body;
    const updateData = {};

    if (story !== undefined) updateData.story = story;
    if (order !== undefined) updateData.order = Number(order);
    if (isActive !== undefined) updateData.isActive = isActive === "true" || isActive === true;

    // Nayi image aayi hai toh purani Cloudinary se delete karke nayi upload karo
    if (req.files && req.files.image) {
      await deleteFromCloudinary(existing.image);
      updateData.image = await uploadToCloudinary(
        req.files.image.data,
        "success-stories"
      );
    }

    const updated = await SuccessStory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: "Story updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/v1/admin/success-stories/:id
 * Story delete karo — Cloudinary se image bhi remove hogi
 */
export const deleteStory = async (req, res) => {
  try {
    const existing = await SuccessStory.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Story not found" });

    // Cloudinary se image delete karo
    await deleteFromCloudinary(existing.image);

    await SuccessStory.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Story deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/v1/admin/success-stories/:id/toggle
 * Story ka isActive toggle karo
 */
export const toggleStoryStatus = async (req, res) => {
  try {
    const existing = await SuccessStory.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Story not found" });

    existing.isActive = !existing.isActive;
    await existing.save();

    res.status(200).json({
      success: true,
      message: `Story ${existing.isActive ? "activated" : "deactivated"} successfully`,
      data: existing,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};