// controllers/examGuideController.js
import { ExamGuideCard, ClbRow } from "../models/examGuideModel.js";

/* ══════════════════════════════════
   EXAM GUIDE CARDS
══════════════════════════════════ */

// GET /api/exam-guide?examType=tcf
export const getGuideCards = async (req, res) => {
  try {
    const { examType } = req.query;
    if (!examType) return res.status(400).json({ success: false, message: "examType required" });

    const cards = await ExamGuideCard.find({ examType }).sort({ order: 1 });
    res.json({ success: true, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/exam-guide
export const createGuideCard = async (req, res) => {
  try {
    const { examType, icon, title, description, items, order } = req.body;
    const card = await ExamGuideCard.create({ examType, icon, title, description, items, order });
    res.status(201).json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/exam-guide/:id
export const updateGuideCard = async (req, res) => {
  try {
    const card = await ExamGuideCard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/exam-guide/:id
export const deleteGuideCard = async (req, res) => {
  try {
    const card = await ExamGuideCard.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════
   CLB ROWS
══════════════════════════════════ */

// GET /api/exam-guide/clb?examType=tcf
export const getClbRows = async (req, res) => {
  try {
    const { examType } = req.query;
    if (!examType) return res.status(400).json({ success: false, message: "examType required" });

    const rows = await ClbRow.find({ examType }).sort({ order: 1 });
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/exam-guide/clb
export const createClbRow = async (req, res) => {
  try {
    const row = await ClbRow.create(req.body);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/exam-guide/clb/:id
export const updateClbRow = async (req, res) => {
  try {
    const row = await ClbRow.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!row) return res.status(404).json({ success: false, message: "Row not found" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/exam-guide/clb/:id
export const deleteClbRow = async (req, res) => {
  try {
    await ClbRow.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};