// routes/examRoutes.js
import express from "express";
import multer  from "multer";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

import {
  getGuideCards, createGuideCard, updateGuideCard, deleteGuideCard,
  getClbRows,    createClbRow,    updateClbRow,    deleteClbRow,
} from "../controllers/examGuideController.js";

import {
  getPapers, createPaper, updatePaper, deletePaper, downloadPaper,
} from "../controllers/samplePaperController.js";

import {
  getSliders,    createSlider,    updateSlider,    deleteSlider,
  getBreakdown,  createBreakdown, updateBreakdown, deleteBreakdown,
} from "../controllers/scoreSystemController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

const router = express.Router();

/* ══════════════════════════════════════════════
   EXAM GUIDE
   ⚠️  IMPORTANT: /clb routes PEHLE hone chahiye
   warna Express "clb" ko :id samajh leta hai
══════════════════════════════════════════════ */

// CLB ROWS — pehle (specific route)
router.get("/exam-guide/clb",          protect,            getClbRows);
router.post("/exam-guide/clb",         protect, adminOnly, createClbRow);
router.put("/exam-guide/clb/:id",      protect, adminOnly, updateClbRow);
router.delete("/exam-guide/clb/:id",   protect, adminOnly, deleteClbRow);

// GUIDE CARDS — baad mein (:id route)
router.get("/exam-guide",              protect,            getGuideCards);
router.post("/exam-guide",             protect, adminOnly, createGuideCard);
router.put("/exam-guide/:id",          protect, adminOnly, updateGuideCard);
router.delete("/exam-guide/:id",       protect, adminOnly, deleteGuideCard);

/* ══════════════════════════════════════════════
   SAMPLE PAPERS
   ⚠️  /download/:id pehle, phir /:id
══════════════════════════════════════════════ */
router.get("/sample-papers",                  protect,            getPapers);
router.get("/sample-papers/download/:id",     protect,            downloadPaper);  // pehle
router.post("/sample-papers",                 protect, adminOnly, upload.single("pdf"), createPaper);
router.put("/sample-papers/:id",              protect, adminOnly, upload.single("pdf"), updatePaper);
router.delete("/sample-papers/:id",           protect, adminOnly, deletePaper);

/* ══════════════════════════════════════════════
   SCORE SYSTEM — SLIDERS
   ⚠️  /sliders specific routes pehle
══════════════════════════════════════════════ */
router.get("/score-system/sliders",           protect,            getSliders);
router.post("/score-system/sliders",          protect, adminOnly, createSlider);
router.put("/score-system/sliders/:id",       protect, adminOnly, updateSlider);
router.delete("/score-system/sliders/:id",    protect, adminOnly, deleteSlider);

/* ══════════════════════════════════════════════
   SCORE SYSTEM — BREAKDOWN
   ⚠️  /breakdown specific routes pehle
══════════════════════════════════════════════ */
router.get("/score-system/breakdown",         protect,            getBreakdown);
router.post("/score-system/breakdown",        protect, adminOnly, createBreakdown);
router.put("/score-system/breakdown/:id",     protect, adminOnly, updateBreakdown);
router.delete("/score-system/breakdown/:id",  protect, adminOnly, deleteBreakdown);

export default router;