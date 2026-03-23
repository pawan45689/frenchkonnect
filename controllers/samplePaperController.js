// controllers/samplePaperController.js
import { SamplePaper } from "../models/samplePaperModel.js";
import {
  uploadPdfToCloudinary,
  deletePdfFromCloudinary,
  getPdfDownloadUrl,
} from "../utils/cloudinary.js";

// GET /api/sample-papers?examType=tcf
export const getPapers = async (req, res) => {
  try {
    const { examType } = req.query;
    if (!examType)
      return res.status(400).json({ success: false, message: "examType required" });

    const papers = await SamplePaper.find({ examType }).sort({ order: 1 });
    res.json({ success: true, data: papers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/sample-papers  (multipart/form-data — field name: "pdf")
export const createPaper = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: "PDF file required" });

    const { examType, title, order } = req.body;

    // Buffer se Cloudinary pe upload karo
    const result = await uploadPdfToCloudinary(req.file.buffer);

    const paper = await SamplePaper.create({
      examType,
      title,
      fileUrl:  result.url,       // Cloudinary PDF URL
      publicId: result.publicId,  // delete ke liye
      order:    order || 0,
    });

    res.status(201).json({ success: true, data: paper });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/sample-papers/:id
export const updatePaper = async (req, res) => {
  try {
    const paper = await SamplePaper.findById(req.params.id);
    if (!paper)
      return res.status(404).json({ success: false, message: "Paper not found" });

    // Agar naya PDF upload hua toh purana Cloudinary se delete karo
    if (req.file) {
      await deletePdfFromCloudinary(paper.publicId);
      const result   = await uploadPdfToCloudinary(req.file.buffer);
      paper.fileUrl  = result.url;
      paper.publicId = result.publicId;
    }

    paper.title    = req.body.title    || paper.title;
    paper.examType = req.body.examType || paper.examType;
    paper.order    = req.body.order    ?? paper.order;
    await paper.save();

    res.json({ success: true, data: paper });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/sample-papers/:id
export const deletePaper = async (req, res) => {
  try {
    const paper = await SamplePaper.findById(req.params.id);
    if (!paper)
      return res.status(404).json({ success: false, message: "Paper not found" });

    // Cloudinary se bhi delete karo
    await deletePdfFromCloudinary(paper.publicId);
    await paper.deleteOne();

    res.json({ success: true, message: "Paper deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/sample-papers/download/:id
// Frontend se download URL milegi — browser seedha PDF download karega
export const downloadPaper = async (req, res) => {
  try {
    const paper = await SamplePaper.findById(req.params.id);
    if (!paper)
      return res.status(404).json({ success: false, message: "Paper not found" });

    // fl_attachment flag lagao — browser download karega open nahi karega
    const downloadUrl = getPdfDownloadUrl(paper.fileUrl);

    res.json({ success: true, downloadUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};