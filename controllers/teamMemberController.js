import TeamMember from "../models/TeamMember.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../uploads/team");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ── Helper: photo save karo ── */
const savePhoto = (file) => {
  const ext      = path.extname(file.name);
  const fileName = `team_${Date.now()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  file.mv(filePath);
  return `uploads/team/${fileName}`;
};

/* ── Helper: purani photo delete karo ── */
const deletePhoto = (photoPath) => {
  if (!photoPath) return;
  const full = path.join(__dirname, "..", photoPath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

/* ══════════════════════════════════════════════════════════════
   PUBLIC — GET all active team members
   GET /api/v1/about/team-members
══════════════════════════════════════════════════════════════ */
export const getPublicTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find({ isActive: true }).sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET all team members (active + inactive)
   GET /api/v1/admin/team-members
══════════════════════════════════════════════════════════════ */
export const getAllTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find().sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET single team member
   GET /api/v1/admin/team-members/:id
══════════════════════════════════════════════════════════════ */
export const getTeamMemberById = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });
    res.status(200).json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — CREATE team member
   POST /api/v1/admin/team-members
   Body: name, role, bio, linkedin, twitter, email, displayOrder
   File: photo (optional)
══════════════════════════════════════════════════════════════ */
export const createTeamMember = async (req, res) => {
  try {
    const { name, role, bio, linkedin, twitter, email, displayOrder, isActive } = req.body;

    if (!name || !role || !bio) {
      return res.status(400).json({ success: false, message: "Name, role and bio are required" });
    }

    /* Photo upload */
    let photo = "";
    if (req.files?.photo) photo = savePhoto(req.files.photo);

    const member = await TeamMember.create({
      photo,
      name:         name.trim(),
      role:         role.trim(),
      bio:          bio.trim(),
      linkedin:     linkedin?.trim()    || "",
      twitter:      twitter?.trim()     || "",
      email:        email?.trim()       || "",
      displayOrder: Number(displayOrder) || 0,
      isActive:     isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    res.status(201).json({ success: true, message: "Team member created", data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — UPDATE team member
   PUT /api/v1/admin/team-members/:id
   File: photo (optional — replaces old one)
   Body: removePhoto="true" — photo hatao
══════════════════════════════════════════════════════════════ */
export const updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });

    const {
      name, role, bio, linkedin, twitter,
      email, displayOrder, isActive, removePhoto,
    } = req.body;

    /* Photo logic */
    let photo = member.photo;
    if (removePhoto === "true")  { deletePhoto(member.photo); photo = ""; }
    if (req.files?.photo)        { deletePhoto(member.photo); photo = savePhoto(req.files.photo); }

    if (name         !== undefined) member.name         = name.trim();
    if (role         !== undefined) member.role         = role.trim();
    if (bio          !== undefined) member.bio          = bio.trim();
    if (linkedin     !== undefined) member.linkedin     = linkedin.trim();
    if (twitter      !== undefined) member.twitter      = twitter.trim();
    if (email        !== undefined) member.email        = email.trim();
    if (displayOrder !== undefined) member.displayOrder = Number(displayOrder);
    if (isActive     !== undefined) member.isActive     = isActive === "true" || isActive === true;
    member.photo = photo;

    await member.save();
    res.status(200).json({ success: true, message: "Team member updated", data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — TOGGLE team member status
   PATCH /api/v1/admin/team-members/:id/toggle
══════════════════════════════════════════════════════════════ */
export const toggleTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });

    member.isActive = !member.isActive;
    await member.save();

    res.status(200).json({
      success: true,
      message: `${member.name} is now ${member.isActive ? "Active" : "Inactive"}`,
      data: member,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — DELETE team member
   DELETE /api/v1/admin/team-members/:id
══════════════════════════════════════════════════════════════ */
export const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });

    /* Photo bhi delete karo */
    deletePhoto(member.photo);

    res.status(200).json({ success: true, message: "Team member deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};