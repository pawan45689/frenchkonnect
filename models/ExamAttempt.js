import mongoose from "mongoose";

/* ── Per-section result snapshot ── */
const sectionResultSchema = new mongoose.Schema({
  sectionId:   { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
  sectionName: { type: String, required: true },
  score:       { type: Number, required: true },   // correct answers
  total:       { type: Number, required: true },   // total questions
  percentage:  { type: Number, required: true },   // 0-100
}, { _id: false });

/* ── Main attempt schema ── */
const examAttemptSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    levelId:     { type: mongoose.Schema.Types.ObjectId, ref: "Level" },
    levelName:   { type: String },                  // e.g. "A1", "B2"
    sectionId:   { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    sectionName: { type: String, required: true },  // e.g. "Listening"
    examType:    { type: String, default: "Practice", enum: ["TEF Canada", "TCF Canada", "Practice"] },

    score:       { type: Number, required: true },
    total:       { type: Number, required: true },
    percentage:  { type: Number, required: true },
     examTitle:   { type: String, default: "" },   // ← NEW
    timeTaken:   { type: Number, default: 0  },

    /* Full question-level results (for review) */
    results: [
      {
        questionId:    String,
        question:      String,
        selectedIndex: Number,
        correctIndex:  Number,
        isCorrect:     Boolean,
      },
    ],
  },
  { timestamps: true }
);

/* Index for fast per-user queries */
examAttemptSchema.index({ userId: 1, createdAt: -1 });
examAttemptSchema.index({ userId: 1, sectionName: 1, createdAt: -1 });

const ExamAttempt = mongoose.model("ExamAttempt", examAttemptSchema);
export default ExamAttempt;