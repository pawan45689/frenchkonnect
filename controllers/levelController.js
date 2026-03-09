import Level from "../models/Level.js";
import Section from "../models/Section.js";
import Lesson from "../models/Lesson.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

/* ══════════════════════════════════════════════════════════════
   ADMIN — CREATE LEVEL (no auto sections)
   POST /api/v1/admin/levels
══════════════════════════════════════════════════════════════ */
export const createLevel = async (req, res) => {
  try {
    const {
      levelName, title, description, levelOutcome,
      displayOrder, isFree, isActive, whatYouWillLearn,
    } = req.body;

    if (!levelName || !title || !description || !levelOutcome) {
      return res.status(400).json({
        success: false,
        message: "levelName, title, description and levelOutcome are required",
      });
    }

    const existing = await Level.findOne({ levelName: levelName.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Level "${levelName}" already exists` });
    }

    let learnPoints = [];
    if (whatYouWillLearn) {
      learnPoints = typeof whatYouWillLearn === "string"
        ? JSON.parse(whatYouWillLearn)
        : whatYouWillLearn;
    }

    let bannerImage = "";
    if (req.files?.bannerImage) {
      bannerImage = await uploadToCloudinary(req.files.bannerImage.data, "levels");
    }

    const level = await Level.create({
      levelName: levelName.trim(),
      title,
      description,
      bannerImage,
      whatYouWillLearn: learnPoints,
      levelOutcome,
      displayOrder:  Number(displayOrder) || 1,
      isFree:        isFree === "true" || isFree === true,
      isActive:      isActive !== "false" && isActive !== false,
    });

    res.status(201).json({
      success: true,
      message: `Level "${levelName}" created successfully`,
      data: level,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET ALL LEVELS
   GET /api/v1/admin/levels
══════════════════════════════════════════════════════════════ */
export const getAllLevels = async (req, res) => {
  try {
    const levels = await Level.find().sort({ displayOrder: 1 });

    const levelsWithCount = await Promise.all(
      levels.map(async (lvl) => {
        const sectionCount = await Section.countDocuments({ level_id: lvl._id });
        return { ...lvl.toObject(), sectionCount };
      })
    );

    res.status(200).json({ success: true, data: levelsWithCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET SINGLE LEVEL + SECTIONS WITH LESSON COUNT
   GET /api/v1/admin/levels/:levelId
══════════════════════════════════════════════════════════════ */
export const getLevelById = async (req, res) => {
  try {
    const level = await Level.findById(req.params.levelId);
    if (!level) return res.status(404).json({ success: false, message: "Level not found" });

    const sections = await Section.find({ level_id: level._id }).sort({ displayOrder: 1 });

    const sectionsWithCount = await Promise.all(
      sections.map(async (sec) => {
        const lessonCount = await Lesson.countDocuments({ section_id: sec._id });
        return { ...sec.toObject(), lessonCount };
      })
    );

    res.status(200).json({ success: true, data: { level, sections: sectionsWithCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — UPDATE LEVEL
   PUT /api/v1/admin/levels/:levelId
══════════════════════════════════════════════════════════════ */
export const updateLevel = async (req, res) => {
  try {
    const level = await Level.findById(req.params.levelId);
    if (!level) return res.status(404).json({ success: false, message: "Level not found" });

    const {
      levelName, title, description, levelOutcome,
      displayOrder, isFree, isActive, whatYouWillLearn, removeBanner,
    } = req.body;

    let learnPoints = level.whatYouWillLearn;
    if (whatYouWillLearn) {
      learnPoints = typeof whatYouWillLearn === "string"
        ? JSON.parse(whatYouWillLearn)
        : whatYouWillLearn;
    }

    let bannerImage = level.bannerImage;

    if (removeBanner === "true") {
      await deleteFromCloudinary(level.bannerImage);
      bannerImage = "";
    }

    if (req.files?.bannerImage) {
      await deleteFromCloudinary(level.bannerImage);
      bannerImage = await uploadToCloudinary(req.files.bannerImage.data, "levels");
    }

    if (levelName && levelName.trim() !== level.levelName) {
      const dup = await Level.findOne({ levelName: levelName.trim(), _id: { $ne: level._id } });
      if (dup) return res.status(400).json({ success: false, message: `Level "${levelName}" already exists` });
    }

    level.levelName        = levelName?.trim()    || level.levelName;
    level.title            = title                || level.title;
    level.description      = description          || level.description;
    level.levelOutcome     = levelOutcome         || level.levelOutcome;
    level.displayOrder     = displayOrder !== undefined ? Number(displayOrder) : level.displayOrder;
    level.isFree           = isFree !== undefined ? (isFree === "true" || isFree === true) : level.isFree;
    level.isActive         = isActive !== undefined ? (isActive !== "false" && isActive !== false) : level.isActive;
    level.whatYouWillLearn = learnPoints;
    level.bannerImage      = bannerImage;

    await level.save();

    res.status(200).json({ success: true, message: "Level updated successfully", data: level });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — TOGGLE LEVEL STATUS
   PATCH /api/v1/admin/levels/:levelId/toggle
══════════════════════════════════════════════════════════════ */
export const toggleLevelStatus = async (req, res) => {
  try {
    const level = await Level.findById(req.params.levelId);
    if (!level) return res.status(404).json({ success: false, message: "Level not found" });

    level.isActive = !level.isActive;
    await level.save();

    res.status(200).json({
      success: true,
      message: `Level is now ${level.isActive ? "Active" : "Inactive"}`,
      data: level,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — DELETE LEVEL (cascade: sections + lessons)
   DELETE /api/v1/admin/levels/:levelId
══════════════════════════════════════════════════════════════ */
export const deleteLevel = async (req, res) => {
  try {
    const level = await Level.findById(req.params.levelId);
    if (!level) return res.status(404).json({ success: false, message: "Level not found" });

    await deleteFromCloudinary(level.bannerImage);
    await Lesson.deleteMany({ level_id: level._id });
    await Section.deleteMany({ level_id: level._id });
    await Level.findByIdAndDelete(level._id);

    res.status(200).json({
      success: true,
      message: `Level "${level.levelName}" and all its sections & lessons deleted`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   PUBLIC — GET ALL ACTIVE LEVELS
   GET /api/v1/levels
══════════════════════════════════════════════════════════════ */
export const getPublicLevels = async (req, res) => {
  try {
    const levels = await Level.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .select("-__v");
    res.status(200).json({ success: true, data: levels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};