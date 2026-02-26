import { About, Timeline, CoreValue, Team, Metric } from "../models/aboutModels.js";
import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Helpers ─────────────────────────────────────────────────
const uploadDir = (folder) => path.join(__dirname, `../uploads/about/${folder}`);

const ensureDir = (folder) => {
  const dir = uploadDir(folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const saveFile = async (file, folder) => {
  const dir      = ensureDir(folder);
  const filename = `${folder}_${Date.now()}${path.extname(file.name)}`;
  await file.mv(path.join(dir, filename));
  return filename;
};

const deleteFile = (folder, filename) => {
  if (!filename) return;
  const filePath = path.join(uploadDir(folder), filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// ══════════════════════════════════════════
// ABOUT — Singleton (GET + UPDATE only)
// ══════════════════════════════════════════

// GET /api/v1/about
export const getAbout = async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) about = await About.create({});
    res.status(200).json({ success: true, data: about });
  } catch (err) {
    console.error("getAbout:", err);
    res.status(500).json({ success: false, message: "Failed to fetch about data" });
  }
};

// PUT /api/v1/about
export const updateAbout = async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) about = new About();

    const textFields = [
      "storyLabel", "storyHeading", "storyIntro",
      "missionTitle", "missionBody", "visionTitle", "visionBody",
      "leadershipTag", "leadershipHeading", "leadershipDescription",
      "leadershipExpYears", "leadershipExpLabel",
      "successHeading", "successDescription",
      "statsHeading", "statsDesc",
    ];
    textFields.forEach((f) => { if (req.body[f] !== undefined) about[f] = req.body[f]; });

    if (req.body.leadershipHighlights)
      about.leadershipHighlights = JSON.parse(req.body.leadershipHighlights);
    if (req.body.successChecklist)
      about.successChecklist = JSON.parse(req.body.successChecklist);

    if (req.files?.leadershipImage) {
      deleteFile("leadership", about.leadershipImage);
      about.leadershipImage = await saveFile(req.files.leadershipImage, "leadership");
    }

    await about.save();
    res.status(200).json({ success: true, message: "About updated successfully", data: about });
  } catch (err) {
    console.error("updateAbout:", err);
    res.status(500).json({ success: false, message: "Failed to update about data" });
  }
};

// ══════════════════════════════════════════
// TIMELINE — Full CRUD
// ══════════════════════════════════════════

// GET /api/v1/about/timeline
export const getTimelines = async (req, res) => {
  try {
    const items = await Timeline.find().sort({ displayOrder: 1, year: 1 });
    res.status(200).json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch timelines" });
  }
};

// POST /api/v1/about/timeline
export const addTimeline = async (req, res) => {
  try {
    const { year, text, displayOrder, status } = req.body;
    if (!year || !text)
      return res.status(400).json({ success: false, message: "Year and text are required" });
    const item = await Timeline.create({ year, text, displayOrder: displayOrder || 0, status: status || "active" });
    res.status(201).json({ success: true, message: "Milestone added", data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add milestone" });
  }
};

// PUT /api/v1/about/timeline/:id
export const updateTimeline = async (req, res) => {
  try {
    const item = await Timeline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Milestone not found" });
    res.status(200).json({ success: true, message: "Milestone updated", data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update milestone" });
  }
};

// DELETE /api/v1/about/timeline/:id
export const deleteTimeline = async (req, res) => {
  try {
    const item = await Timeline.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Milestone not found" });
    res.status(200).json({ success: true, message: "Milestone deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete milestone" });
  }
};

// PATCH /api/v1/about/timeline/:id/toggle
export const toggleTimeline = async (req, res) => {
  try {
    const item = await Timeline.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    item.status = item.status === "active" ? "inactive" : "active";
    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to toggle status" });
  }
};

// ══════════════════════════════════════════
// CORE VALUES — Full CRUD
// ══════════════════════════════════════════

// GET /api/v1/about/core-values
export const getCoreValues = async (req, res) => {
  try {
    const items = await CoreValue.find().sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch core values" });
  }
};

// POST /api/v1/about/core-values
export const addCoreValue = async (req, res) => {
  try {
    const { icon, title, text, displayOrder, status } = req.body;
    if (!icon || !title || !text)
      return res.status(400).json({ success: false, message: "Icon, title and text are required" });
    const item = await CoreValue.create({ icon, title, text, displayOrder: displayOrder || 0, status: status || "active" });
    res.status(201).json({ success: true, message: "Core value added", data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to add core value" });
  }
};

// PUT /api/v1/about/core-values/:id
export const updateCoreValue = async (req, res) => {
  try {
    const item = await CoreValue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Core value not found" });
    res.status(200).json({ success: true, message: "Core value updated", data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update core value" });
  }
};

// DELETE /api/v1/about/core-values/:id
export const deleteCoreValue = async (req, res) => {
  try {
    const item = await CoreValue.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Core value not found" });
    res.status(200).json({ success: true, message: "Core value deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete core value" });
  }
};

// PATCH /api/v1/about/core-values/:id/toggle
export const toggleCoreValue = async (req, res) => {
  try {
    const item = await CoreValue.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    item.status = item.status === "active" ? "inactive" : "active";
    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to toggle status" });
  }
};

// ══════════════════════════════════════════
// TEAM — Full CRUD + Image Upload
// ══════════════════════════════════════════

// GET /api/v1/about/team
export const getTeam = async (req, res) => {
  try {
    const items = await Team.find().sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch team" });
  }
};

// POST /api/v1/about/team
export const addTeamMember = async (req, res) => {
  try {
    const { name, role, bio, linkedin, twitter, email, displayOrder, status } = req.body;
    if (!name || !role)
      return res.status(400).json({ success: false, message: "Name and role are required" });

    let img = "";
    if (req.files?.img) {
      img = await saveFile(req.files.img, "team");
    }

    const item = await Team.create({
      name, role,
      bio:          bio          || "",
      linkedin:     linkedin     || "",
      twitter:      twitter      || "",
      email:        email        || "",
      img,
      displayOrder: displayOrder || 0,
      status:       status       || "active",
    });
    res.status(201).json({ success: true, message: "Team member added", data: item });
  } catch (err) {
    console.error("addTeamMember:", err);
    res.status(500).json({ success: false, message: "Failed to add team member" });
  }
};

// PUT /api/v1/about/team/:id
export const updateTeamMember = async (req, res) => {
  try {
    const member = await Team.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });

    const fields = ["name", "role", "bio", "linkedin", "twitter", "email", "displayOrder", "status"];
    fields.forEach((f) => { if (req.body[f] !== undefined) member[f] = req.body[f]; });

    if (req.files?.img) {
      deleteFile("team", member.img);
      member.img = await saveFile(req.files.img, "team");
    }

    await member.save();
    res.status(200).json({ success: true, message: "Team member updated", data: member });
  } catch (err) {
    console.error("updateTeamMember:", err);
    res.status(500).json({ success: false, message: "Failed to update team member" });
  }
};

// DELETE /api/v1/about/team/:id
export const deleteTeamMember = async (req, res) => {
  try {
    const member = await Team.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });
    deleteFile("team", member.img);
    res.status(200).json({ success: true, message: "Team member deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete team member" });
  }
};

// PATCH /api/v1/about/team/:id/toggle
export const toggleTeamMember = async (req, res) => {
  try {
    const item = await Team.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    item.status = item.status === "active" ? "inactive" : "active";
    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to toggle status" });
  }
};

// ══════════════════════════════════════════
// METRICS — Full CRUD
// ══════════════════════════════════════════

// GET /api/v1/about/metrics
export const getMetrics = async (req, res) => {
  try {
    const items = await Metric.find().sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch metrics" });
  }
};

// POST /api/v1/about/metrics
export const addMetric = async (req, res) => {
  try {
    const { icon, value, label, sub, displayOrder, status } = req.body;
    if (!icon || !value || !label)
      return res.status(400).json({ success: false, message: "Icon, value and label are required" });
    const item = await Metric.create({ icon, value, label, sub: sub || "", displayOrder: displayOrder || 0, status: status || "active" });
    res.status(201).json({ success: true, message: "Metric added", data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to add metric" });
  }
};

// PUT /api/v1/about/metrics/:id
export const updateMetric = async (req, res) => {
  try {
    const item = await Metric.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Metric not found" });
    res.status(200).json({ success: true, message: "Metric updated", data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update metric" });
  }
};

// DELETE /api/v1/about/metrics/:id
export const deleteMetric = async (req, res) => {
  try {
    const item = await Metric.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Metric not found" });
    res.status(200).json({ success: true, message: "Metric deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete metric" });
  }
};

// PATCH /api/v1/about/metrics/:id/toggle
export const toggleMetric = async (req, res) => {
  try {
    const item = await Metric.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    item.status = item.status === "active" ? "inactive" : "active";
    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to toggle status" });
  }
};