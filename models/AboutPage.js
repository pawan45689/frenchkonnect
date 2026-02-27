import mongoose from "mongoose";

/* ══════════════════════════════════════════════════════════════
   AboutPage — SINGLETON MODEL
   Sirf ek document hoga is collection mein
   Admin usse update karega, create/delete nahi
══════════════════════════════════════════════════════════════ */
const aboutPageSchema = new mongoose.Schema(
  {
    /* ── §1  Our Story ── */
    storyLabel:   { type: String, default: "Our Story" },
    storyHeading: { type: String, default: "Empowering French Learners Worldwide" },
    storyIntro:   { type: String, default: "" },
    storyImage:   { type: String, default: "" }, // uploaded file path

    /* ── §2  Mission + Vision ── */
    missionTitle: { type: String, default: "Our Mission" },
    missionBody:  { type: String, default: "" },
    visionTitle:  { type: String, default: "Our Vision" },
    visionBody:   { type: String, default: "" },

    /* ── §3  Leadership — Team Intro (left text block) ── */
    teamIntroTag:      { type: String, default: "Our Expert Team" },
    teamIntroHeading:  { type: String, default: "" },
    teamIntroDesc:     { type: String, default: "" },
    teamIntroImage:    { type: String, default: "" }, // uploaded file path

    /* ── §3  Leadership — 2 Highlight items ── */
    teamIntroHighlights: [
      {
        icon:  { type: String, default: "" }, // e.g. "bi-mortarboard-fill"
        title: { type: String, default: "" },
        text:  { type: String, default: "" },
      },
    ],

    /* ── §3  Team Section Header ── */
    teamSectionTag:     { type: String, default: "Our Team" },
    teamSectionHeading: { type: String, default: "Meet Our Expert Instructors & Leadership" },
    teamSectionDesc:    { type: String, default: "" },
  },
  { timestamps: true }
);

const AboutPage = mongoose.model("AboutPage", aboutPageSchema);
export default AboutPage;