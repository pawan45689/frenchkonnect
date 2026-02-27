import Timeline from "../models/Timeline.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../uploads/timelines");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ── Helper: icon image save karo ── */
const saveIcon = (file) => {
  const ext      = path.extname(file.name);
  const fileName = `timeline_${Date.now()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  file.mv(filePath);
  return `uploads/timelines/${fileName}`;
};

/* ── Helper: purani icon image delete karo ── */
const deleteIcon = (iconPath) => {
  if (!iconPath) return;
  // Sirf file paths delete karo, text icons (emoji/class) nahi
  if (!iconPath.startsWith("uploads/")) return;
  const full = path.join(__dirname, "..", iconPath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

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
      iconValue = saveIcon(req.files.iconImage);
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
      deleteIcon(timeline.icon);
      iconValue = "";
    }
    if (req.files?.iconImage) {
      deleteIcon(timeline.icon);
      iconValue = saveIcon(req.files.iconImage);
    } else if (icon !== undefined) {
      deleteIcon(timeline.icon); // purani image delete karo agar text icon set ho raha hai
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

    /* Icon image bhi delete karo */
    deleteIcon(timeline.icon);

    res.status(200).json({ success: true, message: "Timeline deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};