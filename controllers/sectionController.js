import Section from "../models/Section.js";
import Lesson from "../models/Lesson.js";

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET ALL SECTIONS OF A LEVEL
   GET /api/v1/admin/levels/:levelId/sections
══════════════════════════════════════════════════════════════ */
export const getSectionsByLevel = async (req, res) => {
  try {
    const sections = await Section.find({ level_id: req.params.levelId })
      .sort({ displayOrder: 1 })
      .populate("level_id", "levelName title");

    const sectionsWithCount = await Promise.all(
      sections.map(async (sec) => {
        const lessonCount = await Lesson.countDocuments({ section_id: sec._id });
        return { ...sec.toObject(), lessonCount };
      })
    );

    res.status(200).json({ success: true, data: sectionsWithCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET ALL SECTIONS (flat list, for dropdowns)
   GET /api/v1/admin/sections
══════════════════════════════════════════════════════════════ */
export const getAllSections = async (req, res) => {
  try {
    const { levelId } = req.query;
    const filter = levelId ? { level_id: levelId } : {};

    const sections = await Section.find(filter)
      .sort({ displayOrder: 1 })
      .populate("level_id", "levelName title");

    const sectionsWithCount = await Promise.all(
      sections.map(async (sec) => {
        const lessonCount = await Lesson.countDocuments({ section_id: sec._id });
        return { ...sec.toObject(), lessonCount };
      })
    );

    res.status(200).json({ success: true, data: sectionsWithCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET SINGLE SECTION WITH ITS LESSONS
   GET /api/v1/admin/sections/:sectionId
══════════════════════════════════════════════════════════════ */
export const getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.sectionId).populate(
      "level_id", "levelName title"
    );
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });

    const lessons = await Lesson.find({ section_id: section._id })
      .sort({ displayOrder: 1 });

    res.status(200).json({ success: true, data: { section, lessons } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — ADD SECTION MANUALLY TO A LEVEL
   POST /api/v1/admin/levels/:levelId/sections
══════════════════════════════════════════════════════════════ */
export const addSection = async (req, res) => {
  try {
    const { sectionName, displayOrder } = req.body;

    if (!sectionName) {
      return res.status(400).json({ success: false, message: "Section name is required" });
    }

    const dup = await Section.findOne({
      level_id:    req.params.levelId,
      sectionName: sectionName.trim(),
    });
    if (dup) {
      return res.status(400).json({
        success: false,
        message: `Section "${sectionName}" already exists in this level`,
      });
    }

    const section = await Section.create({
      level_id:     req.params.levelId,
      sectionName:  sectionName.trim(),
      displayOrder: Number(displayOrder) || 1,
      isActive:     true,
    });

    // Populate level info before returning
    await section.populate("level_id", "levelName title");

    res.status(201).json({ success: true, message: "Section added", data: section });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — EDIT SECTION
   PUT /api/v1/admin/sections/:sectionId
══════════════════════════════════════════════════════════════ */
export const updateSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.sectionId);
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });

    const { sectionName, displayOrder } = req.body;

    if (sectionName) section.sectionName = sectionName.trim();
    if (displayOrder !== undefined) section.displayOrder = Number(displayOrder);

    await section.save();
    res.status(200).json({ success: true, message: "Section updated", data: section });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — TOGGLE SECTION STATUS
   PATCH /api/v1/admin/sections/:sectionId/toggle
══════════════════════════════════════════════════════════════ */
export const toggleSectionStatus = async (req, res) => {
  try {
    const section = await Section.findById(req.params.sectionId);
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });

    section.isActive = !section.isActive;
    await section.save();

    res.status(200).json({
      success: true,
      message: `Section "${section.sectionName}" is now ${section.isActive ? "Active" : "Inactive"}`,
      data: section,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — DELETE SECTION + ITS LESSONS
   DELETE /api/v1/admin/sections/:sectionId
══════════════════════════════════════════════════════════════ */
export const deleteSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.sectionId);
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });

    await Lesson.deleteMany({ section_id: section._id });
    await Section.findByIdAndDelete(section._id);

    res.status(200).json({
      success: true,
      message: `Section "${section.sectionName}" and its lessons deleted`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   PUBLIC — GET ACTIVE SECTIONS + LESSONS FOR LEVEL PAGE
   GET /api/v1/levels/:levelId/sections
══════════════════════════════════════════════════════════════ */
export const getPublicSections = async (req, res) => {
  try {
    const sections = await Section.find({
      level_id: req.params.levelId,
      isActive:  true,
    }).sort({ displayOrder: 1 });

    const sectionsWithLessons = await Promise.all(
      sections.map(async (sec) => {
        const lessons = await Lesson.find({ section_id: sec._id, isActive: true })
          .sort({ displayOrder: 1 })
          .select("-contentBlocks");
        return { ...sec.toObject(), lessons };
      })
    );

    res.status(200).json({ success: true, data: sectionsWithLessons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};