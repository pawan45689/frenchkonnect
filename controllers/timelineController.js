import Timeline from "../models/Timeline.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

/* ── Helper: text icon hai ya Cloudinary URL ── */
const isCloudinaryUrl = (icon) => icon?.includes("cloudinary.com");

/* ══════════════════════════════════════════════════════════════
   PUBLIC — GET all active timelines (sorted by order)
   GET /api/v1/about/timelines
══════════════════════════════════════════════════════════════ */
export const getPublicTimelines = async (req, res) => {
  try {
    const timelines = await Timeline.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: timelines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET all timelines
   GET /api/v1/admin/timelines
══════════════════════════════════════════════════════════════ */
export const getAllTimelines = async (req, res) => {
  try {
    const timelines = await Timeline.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: timelines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET single timeline
   GET /api/v1/admin/timelines/:id
══════════════════════════════════════════════════════════════ */
export const getTimelineById = async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);
    if (!timeline) return res.status(404).json({ success: false, message: "Timeline not found" });
    res.status(200).json({ success: true, data: timeline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — CREATE timeline
   POST /api/v1/admin/timelines
   Body : year, text, order, isActive
          icon        → text icon (emoji / CSS class) — optional
   File : iconImage   → image file (optional)
══════════════════════════════════════════════════════════════ */
export const createTimeline = async (req, res) => {
  try {
    const { year, text, icon, order, isActive } = req.body;

    if (!year || !text) {
      return res.status(400).json({ success: false, message: "Year and text are required" });
    }

    /* Icon logic: file upload > text icon */
    let iconValue = icon?.trim() || "";
    if (req.files?.iconImage) {
      iconValue = await uploadToCloudinary(req.files.iconImage.data, "timelines");
    }

    const timeline = await Timeline.create({
      year:     year.trim(),
      text:     text.trim(),
      icon:     iconValue,
      order:    Number(order) || 0,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    res.status(201).json({ success: true, message: "Timeline created", data: timeline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — UPDATE timeline
   PUT /api/v1/admin/timelines/:id
   Body : year, text, order, isActive
          icon          → naya text icon (optional)
          removeIcon    → "true" bhejo to icon hata do
   File : iconImage     → naya image file (optional, purana replace hoga)
══════════════════════════════════════════════════════════════ */
export const updateTimeline = async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);
    if (!timeline) return res.status(404).json({ success: false, message: "Timeline not found" });

    const { year, text, icon, order, isActive, removeIcon } = req.body;

    /* Icon logic */
    let iconValue = timeline.icon || "";
    if (removeIcon === "true") {
      await deleteFromCloudinary(timeline.icon);
      iconValue = "";
    }
    if (req.files?.iconImage) {
      await deleteFromCloudinary(timeline.icon);
      iconValue = await uploadToCloudinary(req.files.iconImage.data, "timelines");
    } else if (icon !== undefined) {
      if (isCloudinaryUrl(timeline.icon)) await deleteFromCloudinary(timeline.icon);
      iconValue = icon.trim();
    }

    if (year     !== undefined) timeline.year     = year.trim();
    if (text     !== undefined) timeline.text     = text.trim();
    if (order    !== undefined) timeline.order    = Number(order);
    if (isActive !== undefined) timeline.isActive = isActive === "true" || isActive === true;
    timeline.icon = iconValue;

    await timeline.save();
    res.status(200).json({ success: true, message: "Timeline updated", data: timeline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — TOGGLE timeline status
   PATCH /api/v1/admin/timelines/:id/toggle
══════════════════════════════════════════════════════════════ */
export const toggleTimeline = async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);
    if (!timeline) return res.status(404).json({ success: false, message: "Timeline not found" });

    timeline.isActive = !timeline.isActive;
    await timeline.save();

    res.status(200).json({
      success: true,
      message: `Timeline is now ${timeline.isActive ? "Active" : "Inactive"}`,
      data: timeline,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — DELETE timeline
   DELETE /api/v1/admin/timelines/:id
══════════════════════════════════════════════════════════════ */
export const deleteTimeline = async (req, res) => {
  try {
    const timeline = await Timeline.findByIdAndDelete(req.params.id);
    if (!timeline) return res.status(404).json({ success: false, message: "Timeline not found" });

    await deleteFromCloudinary(timeline.icon);

    res.status(200).json({ success: true, message: "Timeline deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};