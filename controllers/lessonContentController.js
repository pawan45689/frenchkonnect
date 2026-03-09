import Lesson            from "../models/Lesson.js";
import { transcribeAudio } from "../services/transcribeService.js";
import Groq              from "groq-sdk";
import path              from "path";
import fs                from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const saveRecordingFile = (file) => {
  const uploadDir = path.join(__dirname, "../uploads/recordings");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `rec_${Date.now()}${path.extname(file.name) || ".webm"}`;
  const filePath = path.join(uploadDir, filename);
  file.mv(filePath);
  return { filePath, filename };
};

// ════════════════════════════════════════════
// SPEAKING BLOCK CHECK
// POST /api/v1/lessons/:lessonId/speaking/:blockIndex/check
// ════════════════════════════════════════════
export const checkSpeakingBlock = async (req, res) => {
  let recordingPath = null;
  try {
    const { lessonId, blockIndex } = req.params;

    // Lesson find karo
    const lesson = await Lesson.findOne({ _id: lessonId, isActive: true });
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    // Speaking block find karo
    const speakingBlocks = lesson.contentBlocks.filter(b => b.type === "speaking");
    const block = speakingBlocks[Number(blockIndex)];
    if (!block) return res.status(404).json({ success: false, message: "Speaking block not found" });

    const { promptText, modelAnswer } = block.speakingData || {};
    if (!promptText) return res.status(400).json({ success: false, message: "No prompt text found" });

    if (!req.files?.recording) return res.status(400).json({ success: false, message: "Recording required" });

    // Save recording
    const { filePath } = saveRecordingFile(req.files.recording);
    recordingPath = filePath;

    // AssemblyAI transcribe
    const cues       = await transcribeAudio(recordingPath, "en");
    const userAnswer = cues.map(c => c.text).join(" ").trim();

    console.log(`🗣️ Speaking — User said: "${userAnswer}"`);

    if (!userAnswer) {
      return res.json({
        success: true, correct: false, userAnswer: "",
        feedback: "Nothing heard. Please speak clearly and try again.",
      });
    }

    // Groq check
    const prompt = `Question: "${promptText}"
${modelAnswer ? `Expected answer: "${modelAnswer}"` : ""}
Student said: "${userAnswer}"
Is the student's answer correct?
Reply ONLY in JSON: {"correct": true or false, "feedback": "1 sentence"}`;

    const response = await groq.chat.completions.create({
      model:      "llama-3.1-8b-instant",
      max_tokens: 100,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw    = response.choices[0].message.content.trim();
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());

    if (fs.existsSync(recordingPath)) fs.unlinkSync(recordingPath);

    res.json({ success: true, correct: result.correct, userAnswer, feedback: result.feedback });

  } catch (err) {
    console.error("Speaking check error:", err.message);
    if (recordingPath && fs.existsSync(recordingPath)) fs.unlinkSync(recordingPath);
    res.status(500).json({ success: false, message: "Check failed: " + err.message });
  }
};

// ════════════════════════════════════════════
// LISTENING BLOCK CHECK
// POST /api/v1/lessons/:lessonId/listening/:blockIndex/check
// ════════════════════════════════════════════
export const checkListeningBlock = async (req, res) => {
  try {
    const { lessonId, blockIndex } = req.params;
    const { answers } = req.body; // { "0": "Paris", "1": "Blue" }

    // Lesson find karo
    const lesson = await Lesson.findOne({ _id: lessonId, isActive: true });
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    // Listening block find karo
    const listeningBlocks = lesson.contentBlocks.filter(b => b.type === "listening");
    const block = listeningBlocks[Number(blockIndex)];
    if (!block) return res.status(404).json({ success: false, message: "Listening block not found" });

    const { questions, transcript } = block.listeningData || {};
    if (!questions || questions.length === 0)
      return res.status(400).json({ success: false, message: "No questions found" });

    if (!answers) return res.status(400).json({ success: false, message: "Answers required" });

    const parsedAnswers = typeof answers === "string" ? JSON.parse(answers) : answers;

    // Har question check karo
    const results = await Promise.all(
      questions.map(async (q, i) => {
        const studentAnswer  = parsedAnswers[i] || "";
        const correctAnswer  = q.correctAnswer || "";

        // Simple check — agar MCQ exact match
        if (q.options && q.options.length > 0) {
          const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          return {
            questionIndex:  i,
            question:       q.question,
            studentAnswer,
            correctAnswer,
            correct:        isCorrect,
            feedback:       isCorrect ? "Correct! ✅" : `Wrong! Correct answer: "${correctAnswer}"`,
          };
        }

        // Open answer — Groq se check karo
        const prompt = `Audio transcript: "${transcript || ""}"
Question: "${q.question}"
Correct answer: "${correctAnswer}"
Student said: "${studentAnswer}"
Is the student's answer correct?
Reply ONLY in JSON: {"correct": true or false, "feedback": "1 sentence"}`;

        const response = await groq.chat.completions.create({
          model:      "llama-3.1-8b-instant",
          max_tokens: 100,
          messages:   [{ role: "user", content: prompt }],
        });

        const raw    = response.choices[0].message.content.trim();
        const result = JSON.parse(raw.replace(/```json|```/g, "").trim());

        return {
          questionIndex: i,
          question:      q.question,
          studentAnswer,
          correctAnswer,
          correct:       result.correct,
          feedback:      result.feedback,
        };
      })
    );

    // Score calculate karo
    const correctCount = results.filter(r => r.correct).length;
    const totalCount   = results.length;
    const score        = Math.round((correctCount / totalCount) * 100);
    const passed       = score >= 60;

    res.json({
      success:      true,
      score,
      passed,
      correctCount,
      totalCount,
      results,
      feedback: passed
        ? `Great job! You scored ${score}% 🎉`
        : `You scored ${score}%. Try again! 💪`,
    });

  } catch (err) {
    console.error("Listening check error:", err.message);
    res.status(500).json({ success: false, message: "Check failed: " + err.message });
  }
};