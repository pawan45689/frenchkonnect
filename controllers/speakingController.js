import Speaking            from "../models/Speaking.js";
import { transcribeAudio } from "../services/transcribeService.js";
import Groq                from "groq-sdk";
import path                from "path";
import fs                  from "fs";
import { fileURLToPath }   from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const langMap = {
  French:"fr", English:"en", Hindi:"hi",
  German:"de", Spanish:"es", Italian:"it",
  Portuguese:"pt", Arabic:"ar", Chinese:"zh",
  Japanese:"ja", Korean:"ko", Russian:"ru",
  Turkish:"tr", Dutch:"nl", Polish:"pl",
  Swedish:"sv", Danish:"da", Norwegian:"no",
  Urdu:"ur", Bengali:"bn", Punjabi:"pa",
};

const saveAudioFile = (file) => {
  const uploadDir = path.join(__dirname, "../uploads/speaking");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `speaking_${Date.now()}${path.extname(file.name)}`;
  const filePath = path.join(uploadDir, filename);
  file.mv(filePath);
  return `/uploads/speaking/${filename}`;
};

const saveRecordingFile = (file) => {
  const uploadDir = path.join(__dirname, "../uploads/speaking/recordings");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `rec_${Date.now()}${path.extname(file.name) || ".webm"}`;
  const filePath = path.join(uploadDir, filename);
  file.mv(filePath);
  return { filePath, filename };
};

// ✅ Groq se translate karo
const translateText = async (text, targetLanguage) => {
  if (!text || targetLanguage === "English") return text;
  try {
    const response = await groq.chat.completions.create({
      model:      "llama-3.1-8b-instant",
      max_tokens: 200,
      messages:   [{
        role:    "user",
        content: `Translate this text to ${targetLanguage}. Return ONLY the translated text, nothing else, no explanations, no quotes:\n\n${text}`,
      }],
    });
    const translated = response.choices[0].message.content.trim();
    console.log(`🌐 Translated "${text}" → "${translated}" (${targetLanguage})`);
    return translated;
  } catch (err) {
    console.error("Translation error:", err.message);
    return text; // fallback — original text
  }
};

// ════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════

export const createSpeaking = async (req, res) => {
  try {
    const { title, description, language, level, duration, questionText, expectedPattern } = req.body;

    if (!title)        return res.status(400).json({ success:false, message:"Title is required" });
    if (!questionText) return res.status(400).json({ success:false, message:"Question text is required" });

    const audioUrl = req.files?.audio ? saveAudioFile(req.files.audio) : "";

    // ✅ Auto translate questionText to selected language
    const translatedQuestion = await translateText(questionText, language || "English");

    const speaking = await Speaking.create({
      title,
      description,
      language:        language || "English",
      level:           level    || "A1",
      duration:        Number(duration) || 0,
      questionText:    translatedQuestion,   // ✅ Translated save hoga
      expectedPattern: expectedPattern || "",
      audioUrl,
    });

    res.status(201).json({ success:true, message:"Speaking exercise created!", data:speaking });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

export const getAllSpeakingAdmin = async (req, res) => {
  try {
    const exercises = await Speaking.find().sort({ createdAt: -1 });
    res.json({ success:true, count:exercises.length, data:exercises });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

export const getSpeakingByIdAdmin = async (req, res) => {
  try {
    const exercise = await Speaking.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success:false, message:"Exercise not found" });
    res.json({ success:true, data:exercise });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

export const updateSpeaking = async (req, res) => {
  try {
    const exercise = await Speaking.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success:false, message:"Exercise not found" });

    const { title, description, language, level, duration, questionText, expectedPattern, isActive } = req.body;

    if (title)                         exercise.title       = title;
    if (description !== undefined)     exercise.description = description;
    if (level)                         exercise.level       = level;
    if (duration)                      exercise.duration    = Number(duration);
    if (expectedPattern !== undefined) exercise.expectedPattern = expectedPattern;
    if (isActive !== undefined)        exercise.isActive    = isActive === "true" || isActive === true;

    // ✅ Language ya question change ho to re-translate
    const newLanguage = language || exercise.language;
    if (language) exercise.language = language;

    if (questionText) {
      exercise.questionText = await translateText(questionText, newLanguage);
    } else if (language && language !== exercise.language) {
      // Language badli lekin text same — re-translate
      exercise.questionText = await translateText(exercise.questionText, newLanguage);
    }

    if (req.files?.audio) {
      if (exercise.audioUrl) {
        const oldPath = path.join(__dirname, "..", exercise.audioUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      exercise.audioUrl = saveAudioFile(req.files.audio);
    }

    await exercise.save();
    res.json({ success:true, message:"Exercise updated", data:exercise });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

export const deleteSpeaking = async (req, res) => {
  try {
    const exercise = await Speaking.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success:false, message:"Exercise not found" });

    if (exercise.audioUrl) {
      const filePath = path.join(__dirname, "..", exercise.audioUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await exercise.deleteOne();
    res.json({ success:true, message:"Exercise deleted" });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

// ════════════════════════════════════════════
// PUBLIC
// ════════════════════════════════════════════

export const getAllSpeakingPublic = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.level) filter.level = req.query.level;
    const exercises = await Speaking.find(filter).sort({ createdAt: -1 });
    res.json({ success:true, count:exercises.length, data:exercises });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

export const getSpeakingById = async (req, res) => {
  try {
    const exercise = await Speaking.findOne({ _id: req.params.id, isActive: true });
    if (!exercise) return res.status(404).json({ success:false, message:"Exercise not found" });
    res.json({ success:true, data:exercise });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

// ════════════════════════════════════════════
// CHECK ANSWER
// ════════════════════════════════════════════

export const checkAnswer = async (req, res) => {
  let recordingPath = null;
  try {
    const exercise = await Speaking.findOne({ _id: req.params.id, isActive: true });
    if (!exercise)             return res.status(404).json({ success:false, message:"Exercise not found" });
    if (!req.files?.recording) return res.status(400).json({ success:false, message:"Recording required" });

    const { filePath } = saveRecordingFile(req.files.recording);
    recordingPath = filePath;

    const languageCode = langMap[exercise.language] || "en";
    const cues         = await transcribeAudio(recordingPath, languageCode);
    const userAnswer   = cues.map(c => c.text).join(" ").trim();

    console.log(`📝 User said: "${userAnswer}"`);

    if (!userAnswer) {
      return res.json({
        success:true, correct:false, userAnswer:"",
        feedback:"Nothing heard. Please speak clearly and try again.",
      });
    }

    const patternLine = exercise.expectedPattern
      ? `Expected pattern (any of these are acceptable): "${exercise.expectedPattern}"`
      : `No specific pattern — evaluate if the answer is a natural, correct, relevant response to the question in ${exercise.language}.`;

    const prompt = `You are a language teacher evaluating a student's spoken answer.

Question: "${exercise.questionText}"
Language: ${exercise.language}
${patternLine}
Student said: "${userAnswer}"

Rules:
- Accept natural variations and synonyms
- Answer does NOT need to be word-for-word exact
- Be lenient but accurate

Reply ONLY in this exact JSON (no markdown, no extra text):
{"correct": true or false, "feedback": "1-2 sentence encouraging feedback"}`;

    const response = await groq.chat.completions.create({
      model:      "llama-3.1-8b-instant",
      max_tokens: 200,
      messages:   [{ role:"user", content:prompt }],
    });

    const raw    = response.choices[0].message.content.trim();
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());

    if (fs.existsSync(recordingPath)) fs.unlinkSync(recordingPath);

    res.json({ success:true, correct:result.correct, userAnswer, feedback:result.feedback });

  } catch (err) {
    console.error("Check answer error:", err.message);
    if (recordingPath && fs.existsSync(recordingPath)) fs.unlinkSync(recordingPath);
    res.status(500).json({ success:false, message:"Check failed: " + err.message });
  }
};