import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import connectDB from "./config/db.js";
import config from "./config/config.js";
import { verifyEmailConfig } from "./services/emailService.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import privacyPolicyRoutes from "./routes/privecyPolicyRoutes.js";
import termsConditionsRoutes from "./routes/termsConditionsRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import aboutRoutes from "./routes/aboutRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import speakingRoutes from "./routes/speakingRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import examAttemptRoutes from "./routes/examAttemptRoutes.js";
import successStoryRoutes from "./routes/successStoryRoutes.js";
// ── NEW: Level / Section / Lesson ────────────────────────────
import levelRoutes from "./routes/levelRoutes.js";
// ─────────────────────────────────────────────────────────────



const app = express();

// ── Middleware ───────────────────────────────────────────────
// app.use(cors());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://frenchkonnect.onrender.com',  // ← render
    'https://frenchkonnect.com',
    'https://www.frenchkonnect.com',
    'http://admin.frenchkonnect.com',
    'https://admin.frenchkonnect.com',
  ],
  credentials: true
}));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    abortOnLimit: true,
    responseOnLimit: "File size limit exceeded (Max 50MB)",
    
  })
);



// ── Database ─────────────────────────────────────────────────
connectDB();
verifyEmailConfig();

// ── Routes ───────────────────────────────────────────────────
app.use("/api/v1/auth",             authRoutes);
app.use("/api/v1/contact",          contactRoutes);
app.use("/api/v1/settings",         settingRoutes);
app.use("/api/v1/testimonials",     testimonialRoutes);
app.use("/api/v1/privacy-policy",   privacyPolicyRoutes);
app.use("/api/v1/terms-conditions", termsConditionsRoutes);
app.use("/api/v1/news",             newsRoutes);
app.use("/api/v1/questions",        questionRoutes);
app.use("/api/v1", progressRoutes);
app.use("/api/v1/about",            aboutRoutes);
app.use("/api/v1",           audioRoutes);
app.use("/api/v1", speakingRoutes);
app.use("/api/v1", eventRoutes);
app.use("/api/v1", registrationRoutes);
app.use("/api/v1/exam-attempts", examAttemptRoutes);
app.use("/api/v1", successStoryRoutes);
// ─────────────────────────────────────────────────────────────


// ── NEW: Level / Section / Lesson routes ─────────────────────
app.use("/api/v1", levelRoutes);
// All endpoints become:
//   Public  → /api/v1/levels
//             /api/v1/levels/:id/sections
//             /api/v1/lessons/:id
//   Admin   → /api/v1/admin/levels
//             /api/v1/admin/levels/:id/sections
//             /api/v1/admin/sections/:id
//             /api/v1/admin/sections/:id/lessons
//             /api/v1/admin/lessons/:id
// ─────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ success: true, message: "Server Running", version: "1.0.0" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});