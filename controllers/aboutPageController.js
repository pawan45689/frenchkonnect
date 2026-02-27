import AboutPage from "../models/AboutPage.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../uploads/about");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ── Helper: file save ── */
const saveFile = (file, prefix) => {
  const ext      = path.extname(file.name);
  const fileName = `${prefix}_${Date.now()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  file.mv(filePath);
  return `uploads/about/${fileName}`;
};

/* ── Helper: file delete ── */
const deleteFile = (filePath) => {
  if (!filePath) return;
  const full = path.join(__dirname, "..", filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

/* ── Singleton: ek hi document ensure karo ── */
const getSingleton = async () => {
  let doc = await AboutPage.findOne();
  if (!doc) doc = await AboutPage.create({});
  return doc;
};

/* ══════════════════════════════════════════════════════════════
   PUBLIC — GET About Page (sab ek saath)
   GET /api/v1/about
══════════════════════════════════════════════════════════════ */
export const getAboutPage = async (req, res) => {
  try {
    const doc = await getSingleton();
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — UPDATE About Page
   PUT /api/v1/admin/about
   Supports: storyImage + teamIntroImage upload
   Supports: teamIntroHighlights as JSON string
══════════════════════════════════════════════════════════════ */
export const updateAboutPage = async (req, res) => {
  try {
    const doc = await getSingleton();

    const {
      storyLabel, storyHeading, storyIntro,
      missionTitle, missionBody,
      visionTitle, visionBody,
      teamIntroTag, teamIntroHeading, teamIntroDesc,
      teamIntroHighlights,
      teamSectionTag, teamSectionHeading, teamSectionDesc,
      removeStoryImage, removeTeamIntroImage,
    } = req.body;

    /* ── Story Image ── */
    let storyImage = doc.storyImage;
    if (removeStoryImage === "true") { deleteFile(doc.storyImage); storyImage = ""; }
    if (req.files?.storyImage)       { deleteFile(doc.storyImage); storyImage = saveFile(req.files.storyImage, "story"); }

    /* ── Team Intro Image ── */
    let teamIntroImage = doc.teamIntroImage;
    if (removeTeamIntroImage === "true") { deleteFile(doc.teamIntroImage); teamIntroImage = ""; }
    if (req.files?.teamIntroImage)       { deleteFile(doc.teamIntroImage); teamIntroImage = saveFile(req.files.teamIntroImage, "team_intro"); }

    /* ── Team Intro Highlights (JSON string ya array) ── */
    let highlights = doc.teamIntroHighlights;
    if (teamIntroHighlights !== undefined) {
      highlights = typeof teamIntroHighlights === "string"
        ? JSON.parse(teamIntroHighlights)
        : teamIntroHighlights;
    }

    /* ── Apply fields ── */
    if (storyLabel   !== undefined) doc.storyLabel   = storyLabel.trim();
    if (storyHeading !== undefined) doc.storyHeading = storyHeading.trim();
    if (storyIntro   !== undefined) doc.storyIntro   = storyIntro;
    doc.storyImage = storyImage;

    if (missionTitle !== undefined) doc.missionTitle = missionTitle;
    if (missionBody  !== undefined) doc.missionBody  = missionBody;
    if (visionTitle  !== undefined) doc.visionTitle  = visionTitle;
    if (visionBody   !== undefined) doc.visionBody   = visionBody;

    if (teamIntroTag     !== undefined) doc.teamIntroTag     = teamIntroTag;
    if (teamIntroHeading !== undefined) doc.teamIntroHeading = teamIntroHeading;
    if (teamIntroDesc    !== undefined) doc.teamIntroDesc    = teamIntroDesc;
    doc.teamIntroImage      = teamIntroImage;
    doc.teamIntroHighlights = highlights;

    if (teamSectionTag     !== undefined) doc.teamSectionTag     = teamSectionTag;
    if (teamSectionHeading !== undefined) doc.teamSectionHeading = teamSectionHeading;
    if (teamSectionDesc    !== undefined) doc.teamSectionDesc    = teamSectionDesc;

    await doc.save();

    res.status(200).json({ success: true, message: "About page updated", data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};