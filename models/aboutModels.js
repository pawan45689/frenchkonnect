import mongoose from "mongoose";

// ══════════════════════════════════════════
// 1. ABOUT MODEL (Singleton)
// ══════════════════════════════════════════
const aboutSchema = new mongoose.Schema(
  {
    storyLabel:   { type: String, default: "Our Story" },
    storyHeading: { type: String, default: "Empowering French Learners Worldwide" },
    storyIntro:   { type: String, default: "" },

    missionTitle: { type: String, default: "Our Mission" },
    missionBody:  { type: String, default: "" },
    visionTitle:  { type: String, default: "Our Vision" },
    visionBody:   { type: String, default: "" },

    leadershipTag:         { type: String, default: "Our Expert Team" },
    leadershipHeading:     { type: String, default: "" },
    leadershipDescription: { type: String, default: "" },
    leadershipExpYears:    { type: String, default: "10+" },
    leadershipExpLabel:    { type: String, default: "Years of French Exam Excellence" },
    leadershipImage:       { type: String, default: "" },
    leadershipHighlights: [
      {
        icon:  { type: String, default: "" },
        title: { type: String, default: "" },
        text:  { type: String, default: "" },
      },
    ],

    successHeading:     { type: String, default: "Your TEF/TCF Success Starts Here" },
    successDescription: { type: String, default: "" },
    successChecklist:   [{ type: String }],

    statsHeading: { type: String, default: "Transforming French Learning — One Score at a Time" },
    statsDesc:    { type: String, default: "" },
  },
  { timestamps: true }
);

// ══════════════════════════════════════════
// 2. TIMELINE MODEL
// ══════════════════════════════════════════
const timelineSchema = new mongoose.Schema(
  {
    year:         { type: String, required: true },
    text:         { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    status:       { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// ══════════════════════════════════════════
// 3. CORE VALUES MODEL
// ══════════════════════════════════════════
const coreValueSchema = new mongoose.Schema(
  {
    icon:         { type: String, required: true },
    title:        { type: String, required: true },
    text:         { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    status:       { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// ══════════════════════════════════════════
// 4. TEAM MODEL
// ══════════════════════════════════════════
const teamSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },
    role:         { type: String, required: true },
    bio:          { type: String, default: "" },
    img:          { type: String, default: "" },
    linkedin:     { type: String, default: "" },
    twitter:      { type: String, default: "" },
    email:        { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    status:       { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// ══════════════════════════════════════════
// 5. METRICS MODEL
// ══════════════════════════════════════════
const metricSchema = new mongoose.Schema(
  {
    icon:         { type: String, required: true },
    value:        { type: String, required: true },
    label:        { type: String, required: true },
    sub:          { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    status:       { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const About     = mongoose.model("About",     aboutSchema);
export const Timeline  = mongoose.model("Timeline",  timelineSchema);
export const CoreValue = mongoose.model("CoreValue", coreValueSchema);
export const Team      = mongoose.model("Team",      teamSchema);
export const Metric    = mongoose.model("Metric",    metricSchema);