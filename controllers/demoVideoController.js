import demoVideoModel from "../models/demoVideoModel.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// ══════════════════════════════════════════════════════
// PUBLIC — pricing page ke liye
// ══════════════════════════════════════════════════════

export const getDemoVideo = async (req, res) => {
  try {
    const demo = await demoVideoModel.findOne({ isActive: true });
    res.status(200).json({
      success: true,
      demo: demo || null,
    });
  } catch (error) {
    console.error("Get Demo Video Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch demo video" });
  }
};

// ══════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════

// GET — admin ke liye current demo video
export const getAdminDemoVideo = async (req, res) => {
  try {
    const demo = await demoVideoModel.findOne();
    res.status(200).json({ success: true, demo: demo || null });
  } catch (error) {
    console.error("Get Admin Demo Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch demo video" });
  }
};

// POST — video file upload (Cloudinary)
export const uploadDemoVideoFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file provided" });
    }

    // Purani video Cloudinary se delete karo
    const existing = await demoVideoModel.findOne();
    if (existing?.videoUrl && existing.videoType === "upload") {
      await deleteFromCloudinary(existing.videoUrl);
    }

    // Cloudinary pe upload karo
    const videoUrl = await uploadToCloudinary(req.file.buffer, "demo");

    // Upsert — ek hi document rahega
    const demo = await demoVideoModel.findOneAndUpdate(
      {},
      { videoUrl, videoType: "upload", isActive: true },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Demo video uploaded successfully",
      demo,
    });
  } catch (error) {
    console.error("Upload Demo Video Error:", error);
    res.status(500).json({ success: false, message: "Failed to upload demo video" });
  }
};

// POST — URL se video set karo
export const setDemoVideoUrl = async (req, res) => {
  try {
    const { videoUrl, title } = req.body;

    if (!videoUrl || !videoUrl.trim()) {
      return res.status(400).json({ success: false, message: "Video URL is required" });
    }

    // Agar pehle upload thi to Cloudinary se delete karo
    const existing = await demoVideoModel.findOne();
    if (existing?.videoUrl && existing.videoType === "upload") {
      await deleteFromCloudinary(existing.videoUrl);
    }

    const demo = await demoVideoModel.findOneAndUpdate(
      {},
      {
        videoUrl:  videoUrl.trim(),
        videoType: "url",
        title:     title || "Platform Demo",
        isActive:  true,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Demo video URL saved successfully",
      demo,
    });
  } catch (error) {
    console.error("Set Demo URL Error:", error);
    res.status(500).json({ success: false, message: "Failed to save video URL" });
  }
};

// DELETE — demo video hatao
export const deleteDemoVideo = async (req, res) => {
  try {
    const demo = await demoVideoModel.findOne();

    if (!demo || !demo.videoUrl) {
      return res.status(404).json({ success: false, message: "No demo video found" });
    }

    // Cloudinary se delete karo agar upload thi
    if (demo.videoType === "upload") {
      await deleteFromCloudinary(demo.videoUrl);
    }

    demo.videoUrl  = null;
    demo.videoType = "upload";
    demo.isActive  = false;
    await demo.save();

    res.status(200).json({ success: true, message: "Demo video deleted successfully" });
  } catch (error) {
    console.error("Delete Demo Video Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete demo video" });
  }
};