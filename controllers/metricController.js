import Metric from "../models/Metric.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

/* ── Helper: text icon hai ya Cloudinary URL ── */
const isCloudinaryUrl = (icon) => icon?.includes("cloudinary.com");

/* ══════════════════════════════════════════════════════════════
   PUBLIC — GET all active metrics
   GET /api/v1/about/metrics
══════════════════════════════════════════════════════════════ */
export const getPublicMetrics = async (req, res) => {
  try {
    const metrics = await Metric.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET all metrics
   GET /api/v1/admin/metrics
══════════════════════════════════════════════════════════════ */
export const getAllMetrics = async (req, res) => {
  try {
    const metrics = await Metric.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET single metric
   GET /api/v1/admin/metrics/:id
══════════════════════════════════════════════════════════════ */
export const getMetricById = async (req, res) => {
  try {
    const metric = await Metric.findById(req.params.id);
    if (!metric) return res.status(404).json({ success: false, message: "Metric not found" });
    res.status(200).json({ success: true, data: metric });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — CREATE metric
   POST /api/v1/admin/metrics
   Body : value, label, sub, order, isActive
          icon        → text icon (emoji / CSS class) — optional agar file upload ho
   File : iconImage   → image file (optional, replaces text icon)
══════════════════════════════════════════════════════════════ */
export const createMetric = async (req, res) => {
  try {
    const { icon, value, label, sub, order, isActive } = req.body;

    if (!value || !label) {
      return res.status(400).json({ success: false, message: "Value and label are required" });
    }

    /* Icon logic: file upload > text icon */
    let iconValue = icon?.trim() || "";
    if (req.files?.iconImage) {
      iconValue = await uploadToCloudinary(req.files.iconImage.data, "metrics");
    }

    if (!iconValue) {
      return res.status(400).json({ success: false, message: "Icon (text or image) is required" });
    }

    const metric = await Metric.create({
      icon:     iconValue,
      value:    value.trim(),
      label:    label.trim(),
      sub:      sub?.trim() || "",
      order:    Number(order) || 0,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    res.status(201).json({ success: true, message: "Metric created", data: metric });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — UPDATE metric
   PUT /api/v1/admin/metrics/:id
   Body : value, label, sub, order, isActive
          icon          → naya text icon (optional)
          removeIcon    → "true" bhejo to icon hata do
   File : iconImage     → naya image file (optional, purana replace hoga)
══════════════════════════════════════════════════════════════ */
export const updateMetric = async (req, res) => {
  try {
    const metric = await Metric.findById(req.params.id);
    if (!metric) return res.status(404).json({ success: false, message: "Metric not found" });

    const { icon, value, label, sub, order, isActive, removeIcon } = req.body;

    /* Icon logic */
    let iconValue = metric.icon;
    if (removeIcon === "true") {
      await deleteFromCloudinary(metric.icon);
      iconValue = "";
    }
    if (req.files?.iconImage) {
      await deleteFromCloudinary(metric.icon);
      iconValue = await uploadToCloudinary(req.files.iconImage.data, "metrics");
    } else if (icon !== undefined) {
      if (isCloudinaryUrl(metric.icon)) await deleteFromCloudinary(metric.icon);
      iconValue = icon.trim();
    }

    if (value    !== undefined) metric.value    = value.trim();
    if (label    !== undefined) metric.label    = label.trim();
    if (sub      !== undefined) metric.sub      = sub.trim();
    if (order    !== undefined) metric.order    = Number(order);
    if (isActive !== undefined) metric.isActive = isActive === "true" || isActive === true;
    metric.icon = iconValue;

    await metric.save();
    res.status(200).json({ success: true, message: "Metric updated", data: metric });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — TOGGLE metric status
   PATCH /api/v1/admin/metrics/:id/toggle
══════════════════════════════════════════════════════════════ */
export const toggleMetric = async (req, res) => {
  try {
    const metric = await Metric.findById(req.params.id);
    if (!metric) return res.status(404).json({ success: false, message: "Metric not found" });

    metric.isActive = !metric.isActive;
    await metric.save();

    res.status(200).json({
      success: true,
      message: `Metric is now ${metric.isActive ? "Active" : "Inactive"}`,
      data: metric,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — DELETE metric
   DELETE /api/v1/admin/metrics/:id
══════════════════════════════════════════════════════════════ */
export const deleteMetric = async (req, res) => {
  try {
    const metric = await Metric.findByIdAndDelete(req.params.id);
    if (!metric) return res.status(404).json({ success: false, message: "Metric not found" });

    await deleteFromCloudinary(metric.icon);

    res.status(200).json({ success: true, message: "Metric deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};