import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  time:  { type: String },
  title: { type: String },
  desc:  { type: String },
}, { _id: false });

const organizerSchema = new mongoose.Schema({
  name:     { type: String },
  position: { type: String },
  email:    { type: String },
  phone:    { type: String },
  image:    { type: String }, // uploads/events/organizers/...
}, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────
    title:       { type: String, required: true },
    day:         { type: String, required: true },   // "15"
    month:       { type: String, required: true },   // "May"
    date:        { type: String },                   // "10/24/2023" display format
    time:        { type: String },                   // "09:00 AM - 04:00 PM"
    location:    { type: String },
    category:    { type: String, default: "General" },

    // ── Content ─────────────────────────────────────────
    description:  { type: String },
    description2: { type: String },
    highlights:   [{ type: String }],
    schedule:     [scheduleSchema],

    // ── Images ──────────────────────────────────────────
    image:   { type: String },   // main banner image
    gallery: [{ type: String }], // gallery image paths

    // ── Organizer ────────────────────────────────────────
    organizer: organizerSchema,

    // ── Meta ─────────────────────────────────────────────
    isFeatured:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);