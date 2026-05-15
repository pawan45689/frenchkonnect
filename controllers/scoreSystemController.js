// controllers/scoreSystemController.js
import { SliderConfig, ScoreBreakdown } from "../models/scoreSystemModel.js";

/* ══════════════════════════════════
   SLIDER CONFIG
══════════════════════════════════ */

export const getSliders = async (req, res) => {
  try {
    const { examType } = req.query;
    if (!examType) return res.status(400).json({ success: false, message: "examType required" });
    const sliders = await SliderConfig.find({ examType }).sort({ order: 1 });
    res.json({ success: true, data: sliders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSlider = async (req, res) => {
  try {
    const slider = await SliderConfig.create(req.body);
    res.status(201).json({ success: true, data: slider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSlider = async (req, res) => {
  try {
    const slider = await SliderConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slider) return res.status(404).json({ success: false, message: "Slider not found" });
    res.json({ success: true, data: slider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSlider = async (req, res) => {
  try {
    await SliderConfig.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ NAYA — GET single slider by ID
export const getSliderById = async (req, res) => {
  try {
    const slider = await SliderConfig.findById(req.params.id);
    if (!slider) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: slider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════
   SCORE BREAKDOWN CARDS
══════════════════════════════════ */

export const getBreakdown = async (req, res) => {
  try {
    const { examType } = req.query;
    if (!examType) return res.status(400).json({ success: false, message: "examType required" });
    const cards = await ScoreBreakdown.find({ examType }).sort({ order: 1 });
    res.json({ success: true, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createBreakdown = async (req, res) => {
  try {
    const card = await ScoreBreakdown.create(req.body);
    res.status(201).json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBreakdown = async (req, res) => {
  try {
    const card = await ScoreBreakdown.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteBreakdown = async (req, res) => {
  try {
    await ScoreBreakdown.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ NAYA — GET single breakdown by ID
export const getBreakdownById = async (req, res) => {
  try {
    const card = await ScoreBreakdown.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};