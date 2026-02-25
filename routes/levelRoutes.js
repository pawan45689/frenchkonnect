import express from "express";

import {
  createLevel,
  getAllLevels,
  getLevelById,
  updateLevel,
  toggleLevelStatus,
  deleteLevel,
  getPublicLevels,
} from "../controllers/levelController.js";

import {
  getSectionsByLevel,
  getAllSections,
  getSectionById,
  addSection,
  updateSection,
  toggleSectionStatus,
  deleteSection,
  getPublicSections,
} from "../controllers/sectionController.js";

import {
  createLesson,
  getAllLessons,
  getLessonsBySection,
  getLessonById,
  updateLesson,
  toggleLessonStatus,
  deleteLesson,
  getLessonForUser,
} from "../controllers/lessonController.js";

const router = express.Router();

/* ══════════════════════════════════════════════════════════════
   PUBLIC ROUTES
══════════════════════════════════════════════════════════════ */
router.get("/levels",                     getPublicLevels);
router.get("/levels/:levelId/sections",   getPublicSections);
router.get("/lessons/:lessonId",          getLessonForUser);

/* ══════════════════════════════════════════════════════════════
   ADMIN — LEVEL ROUTES
══════════════════════════════════════════════════════════════ */
router.post  ("/admin/levels",                   createLevel);
router.get   ("/admin/levels",                   getAllLevels);
router.get   ("/admin/levels/:levelId",          getLevelById);
router.put   ("/admin/levels/:levelId",          updateLevel);
router.patch ("/admin/levels/:levelId/toggle",   toggleLevelStatus);
router.delete("/admin/levels/:levelId",          deleteLevel);

/* ══════════════════════════════════════════════════════════════
   ADMIN — SECTION ROUTES
══════════════════════════════════════════════════════════════ */
// Flat list of all sections (with optional ?levelId= filter) — for dropdowns
router.get   ("/admin/sections",                         getAllSections);

// Nested under level
router.get   ("/admin/levels/:levelId/sections",         getSectionsByLevel);
router.post  ("/admin/levels/:levelId/sections",         addSection);

// Single section operations
router.get   ("/admin/sections/:sectionId",              getSectionById);
router.put   ("/admin/sections/:sectionId",              updateSection);
router.patch ("/admin/sections/:sectionId/toggle",       toggleSectionStatus);
router.delete("/admin/sections/:sectionId",              deleteSection);

/* ══════════════════════════════════════════════════════════════
   ADMIN — LESSON ROUTES
══════════════════════════════════════════════════════════════ */
// Flat list of all lessons (with optional ?levelId= or ?sectionId= filter)
router.get   ("/admin/lessons",                          getAllLessons);

// Nested under section
router.post  ("/admin/sections/:sectionId/lessons",      createLesson);
router.get   ("/admin/sections/:sectionId/lessons",      getLessonsBySection);

// Single lesson operations
router.get   ("/admin/lessons/:lessonId",                getLessonById);
router.put   ("/admin/lessons/:lessonId",                updateLesson);
router.patch ("/admin/lessons/:lessonId/toggle",         toggleLessonStatus);
router.delete("/admin/lessons/:lessonId",                deleteLesson);

export default router;