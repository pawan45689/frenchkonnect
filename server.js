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
import levelRoutes from "./routes/levelRoutes.js";
import planRoutes  from "./routes/planRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";
import demoVideoRoutes from "./routes/demoVideoRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import feedPostRoutes  from "./routes/feedPostRoutes.js";
import liveClassRoutes from "./routes/liveClassRoutes.js";
import dashboardRoutes  from "./routes/dashboardRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import heroSectionRoutes from "./routes/heroSectionRoutes.js";
const app = express();

// ── Middleware ───────────────────────────────────────────────
// app.use(cors());
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

// ✅ express-fileupload — sample-papers ko exclude karo (multer handle karega)
app.use((req, res, next) => {
  if (req.path.includes("/sample-papers")) {
    return next(); // ← multer handle karega
  }
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: "File size limit exceeded (Max 50MB)",
  })(req, res, next);
});

// ── Database ─────────────────────────────────────────────────
connectDB();
verifyEmailConfig();

// ── Routes ───────────────────────────────────────────────────
app.use("/api/v1/auth",             authRoutes);
app.use("/api/v1/hero", heroSectionRoutes);
app.use("/api/v1/contact",          contactRoutes);
app.use("/api/v1/settings",         settingRoutes);
app.use("/api/v1/testimonials",     testimonialRoutes);
app.use("/api/v1/privacy-policy",   privacyPolicyRoutes);
app.use("/api/v1/terms-conditions", termsConditionsRoutes);
app.use("/api/v1/news",             newsRoutes);
app.use("/api/v1/questions",        questionRoutes);
app.use("/api/v1", progressRoutes);
app.use("/api/v1/about",            aboutRoutes);
app.use("/api/v1",                  audioRoutes);
app.use("/api/v1",                  speakingRoutes);
app.use("/api/v1",                  eventRoutes);
app.use("/api/v1",                  registrationRoutes);
app.use("/api/v1/exam-attempts",    examAttemptRoutes);
app.use("/api/v1",                  successStoryRoutes);
app.use("/api/v1/plans",            planRoutes);
app.use("/api/v1/promo",            promoRoutes);
app.use("/api/v1",                  examRoutes);
app.use("/api/v1/demo-video",       demoVideoRoutes);
app.use("/api/v1",                  levelRoutes);
app.use("/api/v1", feedPostRoutes);
app.use("/api/v1", liveClassRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/dashboard",    dashboardRoutes);
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