import Lesson from "../models/Lesson.js";
import Section from "../models/Section.js";

/* ══════════════════════════════════════════════════════════════
   ADMIN — CREATE LESSON IN A SECTION
   POST /api/v1/admin/sections/:sectionId/lessons
══════════════════════════════════════════════════════════════ */
export const createLesson = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const section = await Section.findById(sectionId);
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });

    const {
      lessonTitle, description, lessonType,
      xpPoints, displayOrder, isLocked, isActive,
      contentBlocks,
    } = req.body;

    if (!lessonTitle || !description || !lessonType) {
      return res.status(400).json({
        success: false,
        message: "lessonTitle, description and lessonType are required",
      });
    }

    let blocks = [];
    if (contentBlocks) {
      blocks = typeof contentBlocks === "string" ? JSON.parse(contentBlocks) : contentBlocks;
    }

    const lesson = await Lesson.create({
      level_id:      section.level_id,
      section_id:    sectionId,
      lessonTitle:   lessonTitle.trim(),
      description,
      lessonType,
      xpPoints:      Number(xpPoints) || 50,
      displayOrder:  Number(displayOrder) || 1,
      isLocked:      isLocked !== undefined ? (isLocked === "true" || isLocked === true) : true,
      isActive:      isActive !== undefined ? (isActive !== "false" && isActive !== false) : true,
      contentBlocks: blocks,
    });

    res.status(201).json({ success: true, message: "Lesson created successfully", data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET ALL LESSONS (with optional filters)
   GET /api/v1/admin/lessons?levelId=&sectionId=
══════════════════════════════════════════════════════════════ */
export const getAllLessons = async (req, res) => {
  try {
    const { levelId, sectionId } = req.query;
    const filter = {};
    if (levelId)   filter.level_id   = levelId;
    if (sectionId) filter.section_id = sectionId;

    const lessons = await Lesson.find(filter)
      .sort({ displayOrder: 1 })
      .populate("level_id",   "levelName title")
      .populate("section_id", "sectionName");

    res.status(200).json({ success: true, data: lessons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET ALL LESSONS IN A SECTION
   GET /api/v1/admin/sections/:sectionId/lessons
══════════════════════════════════════════════════════════════ */
export const getLessonsBySection = async (req, res) => {
  try {
    const lessons = await Lesson.find({ section_id: req.params.sectionId })
      .sort({ displayOrder: 1 })
      .populate("level_id",   "levelName")
      .populate("section_id", "sectionName");

    res.status(200).json({ success: true, data: lessons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET SINGLE LESSON WITH FULL CONTENT BLOCKS
   GET /api/v1/admin/lessons/:lessonId
══════════════════════════════════════════════════════════════ */
export const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId)
      .populate("level_id",   "levelName title")
      .populate("section_id", "sectionName");

    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    res.status(200).json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — UPDATE LESSON
   PUT /api/v1/admin/lessons/:lessonId
══════════════════════════════════════════════════════════════ */
export const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    const {
      lessonTitle, description, lessonType,
      xpPoints, displayOrder, isLocked, isActive,
      contentBlocks,
    } = req.body;

    let blocks = lesson.contentBlocks;
    if (contentBlocks !== undefined) {
      blocks = typeof contentBlocks === "string" ? JSON.parse(contentBlocks) : contentBlocks;
    }

    lesson.lessonTitle   = lessonTitle?.trim()  || lesson.lessonTitle;
    lesson.description   = description          || lesson.description;
    lesson.lessonType    = lessonType           || lesson.lessonType;
    lesson.xpPoints      = xpPoints      !== undefined ? Number(xpPoints)      : lesson.xpPoints;
    lesson.displayOrder  = displayOrder  !== undefined ? Number(displayOrder)  : lesson.displayOrder;
    lesson.isLocked      = isLocked      !== undefined ? (isLocked === "true"  || isLocked === true)  : lesson.isLocked;
    lesson.isActive      = isActive      !== undefined ? (isActive !== "false" && isActive !== false) : lesson.isActive;
    lesson.contentBlocks = blocks;

    await lesson.save();

    res.status(200).json({ success: true, message: "Lesson updated successfully", data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — TOGGLE LESSON STATUS
   PATCH /api/v1/admin/lessons/:lessonId/toggle
══════════════════════════════════════════════════════════════ */
export const toggleLessonStatus = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    lesson.isActive = !lesson.isActive;
    await lesson.save();

    res.status(200).json({
      success: true,
      message: `Lesson is now ${lesson.isActive ? "Active" : "Inactive"}`,
      data: lesson,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — DELETE LESSON
   DELETE /api/v1/admin/lessons/:lessonId
══════════════════════════════════════════════════════════════ */
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    res.status(200).json({ success: true, message: "Lesson deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   PUBLIC — USER OPENS A LESSON
   GET /api/v1/lessons/:lessonId
   ✅ level_id aur section_id dono populate kiye — LevelHeader ke liye
══════════════════════════════════════════════════════════════ */
export const getLessonForUser = async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ _id: req.params.lessonId, isActive: true })
      .populate(
        "level_id",
        "levelName title isFree description whatYouWillLearn levelOutcome bannerImage"
      )
      .populate("section_id", "sectionName");

    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    if (lesson.isLocked) {
      const prev = await Lesson.findOne({
        section_id:   lesson.section_id,
        displayOrder: lesson.displayOrder - 1,
      });
      if (prev) {
        return res.status(403).json({
          success: false,
          message: `Complete "${prev.lessonTitle}" first to unlock this lesson`,
        });
      }
    }

    res.status(200).json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};