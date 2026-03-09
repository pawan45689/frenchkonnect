// controllers/audioController.js
import Audio               from "../models/Audio.js";
import { transcribeAudio } from "../services/transcribeService.js";
import path                from "path";
import fs                  from "fs";
import { fileURLToPath }   from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const saveAudioFile = (file) => {
  const uploadDir = path.join(__dirname, "../uploads/audio");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `audio_${Date.now()}${path.extname(file.name)}`;
  const filePath = path.join(uploadDir, filename);
  file.mv(filePath);
  return `/uploads/audio/${filename}`;
};

// Language name → AssemblyAI code
const langMap = {
  French: "fr", English: "en", Hindi: "hi",
  German: "de", Spanish: "es", Italian: "it",
};

// ════════════════════════════════════════════════════════════
//  ADMIN
// ════════════════════════════════════════════════════════════

// POST /api/v1/admin/audio
// Audio create hote hi automatically transcribe hoga
export const createAudio = async (req, res) => {
  try {
    if (!req.files?.audio)
      return res.status(400).json({ success: false, message: "Audio file is required" });

    const { title, description, language, level, duration } = req.body;
    if (!title)
      return res.status(400).json({ success: false, message: "Title is required" });

    const audioUrl = saveAudioFile(req.files.audio);

    const audio = await Audio.create({
      title, description, language, level,
      duration: Number(duration) || 0,
      audioUrl,
      cues: [],
    });

    // ✅ Response turant bhejo
    res.status(201).json({
      success: true,
      message: "Audio created! Transcription started automatically...",
      data: audio,
    });

    // ✅ Background mein transcribe karo
    const localPath    = path.join(__dirname, "..", audioUrl);
    const languageCode = langMap[language] || "en";

    console.log(`🎙️  Auto-transcribing "${title}" in ${language} (${languageCode})...`);
    const cues = await transcribeAudio(localPath, languageCode);
    audio.cues = cues;
    await audio.save();
    console.log(`✅ Cues saved for "${title}" — ${cues.length} cues`);

  } catch (err) {
    console.error("Create/Transcribe error:", err.message);
  }
};

// GET /api/v1/admin/audio
export const getAllAudioAdmin = async (req, res) => {
  try {
    const audios = await Audio.find().sort({ createdAt: -1 });
    res.json({ success: true, count: audios.length, data: audios });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/admin/audio/:id
export const getAudioByIdAdmin = async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) return res.status(404).json({ success: false, message: "Audio not found" });
    res.json({ success: true, data: audio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/admin/audio/:id
export const updateAudio = async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) return res.status(404).json({ success: false, message: "Audio not found" });

    const { title, description, language, level, duration, isActive } = req.body;
    if (title)                     audio.title       = title;
    if (description !== undefined) audio.description = description;
    if (language)                  audio.language    = language;
    if (level)                     audio.level       = level;
    if (duration)                  audio.duration    = Number(duration);
    if (isActive !== undefined)    audio.isActive    = isActive === "true" || isActive === true;

    // Agar nayi audio file upload ki — re-transcribe bhi karo
    if (req.files?.audio) {
      const oldPath = path.join(__dirname, "..", audio.audioUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      audio.audioUrl = saveAudioFile(req.files.audio);
      audio.cues     = []; // purane cues clear karo
    }

    await audio.save();
    res.json({ success: true, message: "Audio updated", data: audio });

    // Agar new audio file di — background mein re-transcribe
    if (req.files?.audio) {
      const localPath    = path.join(__dirname, "..", audio.audioUrl);
      const languageCode = langMap[audio.language] || "en";
      console.log(`🎙️  Re-transcribing "${audio.title}"...`);
      const cues = await transcribeAudio(localPath, languageCode);
      audio.cues = cues;
      await audio.save();
      console.log(`✅ Re-transcribed "${audio.title}" — ${cues.length} cues`);
    }

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/admin/audio/:id
export const deleteAudio = async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) return res.status(404).json({ success: false, message: "Audio not found" });

    const filePath = path.join(__dirname, "..", audio.audioUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await audio.deleteOne();
    res.json({ success: true, message: "Audio deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/admin/audio/:id/transcribe  (manual retry)
export const transcribeAudioAI = async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) return res.status(404).json({ success: false, message: "Audio not found" });

    const localPath = path.join(__dirname, "..", audio.audioUrl);
    if (!fs.existsSync(localPath))
      return res.status(404).json({ success: false, message: "Audio file not found on disk" });

    const languageCode = req.body?.language || langMap[audio.language] || "en";

    res.json({ success: true, message: "Transcription started! Wait 20-30 seconds then refresh." });

    const cues = await transcribeAudio(localPath, languageCode);
    audio.cues = cues;
    await audio.save();
    console.log(`✅ Manual transcribe done for "${audio.title}" — ${cues.length} cues`);

  } catch (err) {
    console.error("Transcription error:", err.message);
  }
};

// ════════════════════════════════════════════════════════════
//  PUBLIC
// ════════════════════════════════════════════════════════════

export const getAllAudioPublic = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.level) filter.level = req.query.level;
    const audios = await Audio.find(filter, "-cues").sort({ createdAt: -1 });
    res.json({ success: true, count: audios.length, data: audios });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAudioById = async (req, res) => {
  try {
    const audio = await Audio.findOne({ _id: req.params.id, isActive: true });
    if (!audio) return res.status(404).json({ success: false, message: "Audio not found" });
    res.json({ success: true, data: audio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};