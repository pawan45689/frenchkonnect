import express from "express";
import {
  getAbout,       updateAbout,
  getTimelines,   addTimeline,   updateTimeline,   deleteTimeline,   toggleTimeline,
  getCoreValues,  addCoreValue,  updateCoreValue,  deleteCoreValue,  toggleCoreValue,
  getTeam,        addTeamMember, updateTeamMember, deleteTeamMember, toggleTeamMember,
  getMetrics,     addMetric,     updateMetric,     deleteMetric,     toggleMetric,
} from "../controllers/aboutController.js";

const router = express.Router();

// ── About (Singleton) ─────────────────────────────────────────
router.get("/",    getAbout);
router.put("/",    updateAbout);

// ── Timeline ──────────────────────────────────────────────────
router.get("/timeline",               getTimelines);
router.post("/timeline",              addTimeline);
router.put("/timeline/:id",           updateTimeline);
router.delete("/timeline/:id",        deleteTimeline);
router.patch("/timeline/:id/toggle",  toggleTimeline);

// ── Core Values ───────────────────────────────────────────────
router.get("/core-values",                getCoreValues);
router.post("/core-values",               addCoreValue);
router.put("/core-values/:id",            updateCoreValue);
router.delete("/core-values/:id",         deleteCoreValue);
router.patch("/core-values/:id/toggle",   toggleCoreValue);

// ── Team ──────────────────────────────────────────────────────
router.get("/team",               getTeam);
router.post("/team",              addTeamMember);
router.put("/team/:id",           updateTeamMember);
router.delete("/team/:id",        deleteTeamMember);
router.patch("/team/:id/toggle",  toggleTeamMember);

// ── Metrics ───────────────────────────────────────────────────
router.get("/metrics",              getMetrics);
router.post("/metrics",             addMetric);
router.put("/metrics/:id",          updateMetric);
router.delete("/metrics/:id",       deleteMetric);
router.patch("/metrics/:id/toggle", toggleMetric);

export default router;

// ─────────────────────────────────────────────────────────────
// app.js mein sirf ye 3 lines add karo:
//
// import aboutRoutes from "./routes/aboutRoutes.js";
// path.join(__dirname, "uploads/about/team"),
// path.join(__dirname, "uploads/about/leadership"),
// app.use("/api/v1/about", aboutRoutes);
// ─────────────────────────────────────────────────────────────