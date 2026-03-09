import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text:  { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    label: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    examTitle: {
      type:     String,
      required: [true, "Exam title is required"],
      trim:     true,
    },
    level: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Level",
      required: [true, "Level is required"],
    },
    category: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Section",
      required: [true, "Category (Section) is required"],
    },

    /* ── Exam Type — Practice / TEF Canada / TCF Canada ── */
    examType: {
      type:    String,
      enum:    ["Practice", "TEF Canada", "TCF Canada"],
      default: "Practice",
    },

    /* ── Total exam duration in minutes ── */
    examDuration: {
      type:     Number,
      required: [true, "Exam duration is required"],
      min:      [1,   "Duration must be at least 1 minute"],
      max:      [300, "Duration cannot exceed 300 minutes"],
    },

    /* ── Custom intro note — shown in blue box on intro screen ── */
    introNote: {
      type:    String,
      trim:    true,
      default: "",
    },

    question: {
      type:    String,
      trim:    true,
      default: "",
    },
    questionImage: {
      type:    String,
      trim:    true,
      default: "",
    },
    questionType: {
      type:    String,
      enum:    ["text", "image", "text+image"],
      default: "text",
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 6,
        message:   "Options must be between 2 and 6",
      },
      required: [true, "Options are required"],
    },
    optionType: {
      type:    String,
      enum:    ["text", "image", "mixed"],
      default: "text",
    },
    correct: {
      type:     Number,
      required: [true, "Correct answer index is required"],
      min:      0,
    },
    explanation: {
      type:    String,
      trim:    true,
      default: "",
    },
    explanationImage: {
      type:    String,
      trim:    true,
      default: "",
    },
    timeLimit: {
      type:    Number,
      default: 15,
      min:     1,
      max:     120,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    order: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true }
);

questionSchema.index({ level: 1, category: 1, isActive: 1 });
questionSchema.index({ examTitle: 1 });
questionSchema.index({ examType: 1 });   // ← filter ke liye

const Question = mongoose.model("Question", questionSchema);
export default Question;