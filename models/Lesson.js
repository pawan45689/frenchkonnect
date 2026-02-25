import mongoose from "mongoose";

// ── VIDEO ──────────────────────────────────────────
const videoBlockSchema = new mongoose.Schema({
  videoUrl:         { type: String, default: "" },
  videoTitle:       { type: String, default: "" },
  videoDescription: { type: String, default: "" },
}, { _id: false });

// ── VOCAB ──────────────────────────────────────────
const vocabWordSchema = new mongoose.Schema({
  frenchWord:      { type: String, default: "" },
  englishMeaning:  { type: String, default: "" },
  exampleSentence: { type: String, default: "" },
  audioUrl:        { type: String, default: "" },
}, { _id: false });

const vocabBlockSchema = new mongoose.Schema({
  words: { type: [vocabWordSchema], default: [] },
}, { _id: false });

// ── FLASHCARD ──────────────────────────────────────
const flashcardItemSchema = new mongoose.Schema({
  front: { type: String, default: "" },
  back:  { type: String, default: "" },
  image: { type: String, default: "" },
}, { _id: false });

const flashcardBlockSchema = new mongoose.Schema({
  cards: { type: [flashcardItemSchema], default: [] },
}, { _id: false });

// ── GRAMMAR ────────────────────────────────────────
const grammarBlockSchema = new mongoose.Schema({
  ruleTitle:   { type: String, default: "" },
  explanation: { type: String, default: "" },
  examples: [{
    french:  { type: String, default: "" },
    english: { type: String, default: "" },
  }],
}, { _id: false });

// ── LISTENING ──────────────────────────────────────
const listeningQuestionSchema = new mongoose.Schema({
  question:      { type: String, default: "" },
  options:       [{ type: String }],
  correctAnswer: { type: String, default: "" },
}, { _id: false });

const listeningBlockSchema = new mongoose.Schema({
  audioUrl:   { type: String, default: "" },
  transcript: { type: String, default: "" },
  questions:  { type: [listeningQuestionSchema], default: [] },
}, { _id: false });

// ── SPEAKING ───────────────────────────────────────
const speakingBlockSchema = new mongoose.Schema({
  promptText:      { type: String, default: "" },
  modelAnswer:     { type: String, default: "" },
  difficultyLevel: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
}, { _id: false });

// ── QUIZ ───────────────────────────────────────────
const quizQuestionSchema = new mongoose.Schema({
  questionText:  { type: String, default: "" },
  questionType:  { type: String, enum: ["mcq", "fill_blank", "match"], default: "mcq" },
  options:       [{ type: String }],
  correctAnswer: { type: String, default: "" },
}, { _id: false });

const quizBlockSchema = new mongoose.Schema({
  questions: { type: [quizQuestionSchema], default: [] },
}, { _id: false });

// ── CONTENT BLOCK (master) ─────────────────────────
const contentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["video", "vocab", "flashcard", "grammar", "listening", "speaking", "quiz"],
    required: true,
  },
  blockOrder:    { type: Number, default: 1 },
  videoData:     { type: videoBlockSchema,     default: null },
  vocabData:     { type: vocabBlockSchema,     default: null },
  flashcardData: { type: flashcardBlockSchema, default: null },
  grammarData:   { type: grammarBlockSchema,   default: null },
  listeningData: { type: listeningBlockSchema, default: null },
  speakingData:  { type: speakingBlockSchema,  default: null },
  quizData:      { type: quizBlockSchema,      default: null },
}, { _id: false });

// ── MAIN LESSON SCHEMA ─────────────────────────────
const lessonSchema = new mongoose.Schema(
  {
    level_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
    section_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    lessonTitle: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    lessonType: {
      type: String,
      enum: ["video", "flashcard", "exercise", "speaking", "quiz", "mixed"],
      required: true,
    },
    xpPoints: {
      type: Number,
      default: 50,
    },
    displayOrder: {
      type: Number,
      required: true,
      default: 1,
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    contentBlocks: {
      type: [contentBlockSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Lesson", lessonSchema);