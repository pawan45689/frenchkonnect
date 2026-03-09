import AboutPage from "../models/AboutPage.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

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
   Supports: storyImage + teamIntroImage upload (Cloudinary)
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
    if (removeStoryImage === "true") {
      await deleteFromCloudinary(doc.storyImage);
      storyImage = "";
    }
    if (req.files?.storyImage) {
      await deleteFromCloudinary(doc.storyImage);
      storyImage = await uploadToCloudinary(req.files.storyImage.data, "about");
    }

    /* ── Team Intro Image ── */
    let teamIntroImage = doc.teamIntroImage;
    if (removeTeamIntroImage === "true") {
      await deleteFromCloudinary(doc.teamIntroImage);
      teamIntroImage = "";
    }
    if (req.files?.teamIntroImage) {
      await deleteFromCloudinary(doc.teamIntroImage);
      teamIntroImage = await uploadToCloudinary(req.files.teamIntroImage.data, "about");
    }

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