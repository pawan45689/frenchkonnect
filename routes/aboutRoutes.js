import express from "express";

/* ── Controllers ── */
import {
  getAboutPage,
  updateAboutPage,
} from "../controllers/aboutPageController.js";

import {
  getPublicTimelines,
  getAllTimelines,
  getTimelineById,
  createTimeline,
  updateTimeline,
  toggleTimeline,
  deleteTimeline,
} from "../controllers/timelineController.js";

import {
  getPublicCoreValues,
  getAllCoreValues,
  getCoreValueById,
  createCoreValue,
  updateCoreValue,
  toggleCoreValue,
  deleteCoreValue,
} from "../controllers/coreValueController.js";

import {
  getPublicMetrics,
  getAllMetrics,
  getMetricById,
  createMetric,
  updateMetric,
  toggleMetric,
  deleteMetric,
} from "../controllers/metricController.js";

import {
  getPublicTeamMembers,
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  toggleTeamMember,
  deleteTeamMember,
} from "../controllers/teamMemberController.js";

const router = express.Router();

/* ══════════════════════════════════════════════════════════════
   ██████  PUBLIC ROUTES  ██████
   Frontend ke liye — sirf GET, sirf active data
   Base: /api/v1/about
══════════════════════════════════════════════════════════════ */

// ── About Page (singleton — story, mission, vision, team intro) ──
router.get("/",              getAboutPage);

// ── Timeline milestones ──
router.get("/timelines",     getPublicTimelines);

// ── Core Values ──
router.get("/core-values",   getPublicCoreValues);

// ── Metrics / Stats ──
router.get("/metrics",       getPublicMetrics);

// ── Team Members ──
router.get("/team-members",  getPublicTeamMembers);


/* ══════════════════════════════════════════════════════════════
   ██████  ADMIN ROUTES  ██████
   Base: /api/v1/admin
   (isAdmin middleware apni routes file mein lagao)
══════════════════════════════════════════════════════════════ */

// ── About Page singleton ──
router.get ("/admin/about",  getAboutPage);   // GET (admin preview)
router.put ("/admin/about",  updateAboutPage); // PUT (update with image upload)

// ── Timelines ──
router.get   ("/admin/timelines",              getAllTimelines);
router.get   ("/admin/timelines/:id",          getTimelineById);
router.post  ("/admin/timelines",              createTimeline);
router.put   ("/admin/timelines/:id",          updateTimeline);
router.patch ("/admin/timelines/:id/toggle",   toggleTimeline);
router.delete("/admin/timelines/:id",          deleteTimeline);

// ── Core Values ──
router.get   ("/admin/core-values",            getAllCoreValues);
router.get   ("/admin/core-values/:id",        getCoreValueById);
router.post  ("/admin/core-values",            createCoreValue);
router.put   ("/admin/core-values/:id",        updateCoreValue);
router.patch ("/admin/core-values/:id/toggle", toggleCoreValue);
router.delete("/admin/core-values/:id",        deleteCoreValue);

// ── Metrics ──
router.get   ("/admin/metrics",                getAllMetrics);
router.get   ("/admin/metrics/:id",            getMetricById);
router.post  ("/admin/metrics",                createMetric);
router.put   ("/admin/metrics/:id",            updateMetric);
router.patch ("/admin/metrics/:id/toggle",     toggleMetric);
router.delete("/admin/metrics/:id",            deleteMetric);

// ── Team Members ──
router.get   ("/admin/team-members",              getAllTeamMembers);
router.get   ("/admin/team-members/:id",          getTeamMemberById);
router.post  ("/admin/team-members",              createTeamMember);
router.put   ("/admin/team-members/:id",          updateTeamMember);
router.patch ("/admin/team-members/:id/toggle",   toggleTeamMember);
router.delete("/admin/team-members/:id",          deleteTeamMember);

export default router;