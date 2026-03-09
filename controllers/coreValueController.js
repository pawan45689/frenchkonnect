import CoreValue from "../models/CoreValue.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

/* ── Helper: text icon hai ya Cloudinary URL ── */
const isCloudinaryUrl = (icon) => icon?.includes("cloudinary.com");

/* ══════════════════════════════════════════════════════════════
   PUBLIC — GET all active core values
   GET /api/v1/about/core-values
══════════════════════════════════════════════════════════════ */
export const getPublicCoreValues = async (req, res) => {
  try {
    const values = await CoreValue.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: values });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET all core values
   GET /api/v1/admin/core-values
══════════════════════════════════════════════════════════════ */
export const getAllCoreValues = async (req, res) => {
  try {
    const values = await CoreValue.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: values });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET single core value
   GET /api/v1/admin/core-values/:id
══════════════════════════════════════════════════════════════ */
export const getCoreValueById = async (req, res) => {
  try {
    const value = await CoreValue.findById(req.params.id);
    if (!value) return res.status(404).json({ success: false, message: "Core value not found" });
    res.status(200).json({ success: true, data: value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — CREATE core value
   POST /api/v1/admin/core-values
   Body : title, text, order, isActive
          icon        → text icon (emoji / CSS class) — optional agar file upload ho
   File : iconImage   → image file (optional, replaces text icon)
══════════════════════════════════════════════════════════════ */
export const createCoreValue = async (req, res) => {
  try {
    const { icon, title, text, order, isActive } = req.body;

    if (!title || !text) {
      return res.status(400).json({ success: false, message: "Title and text are required" });
    }

    /* Icon logic: file upload > text icon */
    let iconValue = icon?.trim() || "";
    if (req.files?.iconImage) {
      iconValue = await uploadToCloudinary(req.files.iconImage.data, "core-values");
    }

    if (!iconValue) {
      return res.status(400).json({ success: false, message: "Icon (text or image) is required" });
    }

    const value = await CoreValue.create({
      icon:     iconValue,
      title:    title.trim(),
      text:     text.trim(),
      order:    Number(order) || 0,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    res.status(201).json({ success: true, message: "Core value created", data: value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — UPDATE core value
   PUT /api/v1/admin/core-values/:id
   Body : title, text, order, isActive
          icon          → naya text icon (optional)
          removeIcon    → "true" bhejo to icon hata do
   File : iconImage     → naya image file (optional, purana replace hoga)
══════════════════════════════════════════════════════════════ */
export const updateCoreValue = async (req, res) => {
  try {
    const value = await CoreValue.findById(req.params.id);
    if (!value) return res.status(404).json({ success: false, message: "Core value not found" });

    const { icon, title, text, order, isActive, removeIcon } = req.body;

    /* Icon logic */
    let iconValue = value.icon;
    if (removeIcon === "true") {
      await deleteFromCloudinary(value.icon);
      iconValue = "";
    }
    if (req.files?.iconImage) {
      await deleteFromCloudinary(value.icon);
      iconValue = await uploadToCloudinary(req.files.iconImage.data, "core-values");
    } else if (icon !== undefined) {
      if (isCloudinaryUrl(value.icon)) await deleteFromCloudinary(value.icon);
      iconValue = icon.trim();
    }

    if (title    !== undefined) value.title    = title.trim();
    if (text     !== undefined) value.text     = text.trim();
    if (order    !== undefined) value.order    = Number(order);
    if (isActive !== undefined) value.isActive = isActive === "true" || isActive === true;
    value.icon = iconValue;

    await value.save();
    res.status(200).json({ success: true, message: "Core value updated", data: value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — TOGGLE core value status
   PATCH /api/v1/admin/core-values/:id/toggle
══════════════════════════════════════════════════════════════ */
export const toggleCoreValue = async (req, res) => {
  try {
    const value = await CoreValue.findById(req.params.id);
    if (!value) return res.status(404).json({ success: false, message: "Core value not found" });

    value.isActive = !value.isActive;
    await value.save();

    res.status(200).json({
      success: true,
      message: `Core value is now ${value.isActive ? "Active" : "Inactive"}`,
      data: value,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — DELETE core value
   DELETE /api/v1/admin/core-values/:id
══════════════════════════════════════════════════════════════ */
export const deleteCoreValue = async (req, res) => {
  try {
    const value = await CoreValue.findByIdAndDelete(req.params.id);
    if (!value) return res.status(404).json({ success: false, message: "Core value not found" });

    await deleteFromCloudinary(value.icon);

    res.status(200).json({ success: true, message: "Core value deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};