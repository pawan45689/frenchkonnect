import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    examTitle: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },

    // ✅ Ab yeh Level collection ka ObjectId reference hai
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: [true, "Level is required"],
    },

    // ✅ Ab yeh Section collection ka ObjectId reference hai
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: [true, "Category (Section) is required"],
    },

    question: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.length >= 2 && arr.length <= 6;
        },
        message: "Options must be between 2 and 6",
      },
      required: [true, "Options are required"],
    },
    correct: {
      type: Number,
      required: [true, "Correct answer index is required"],
      min: 0,
    },
    explanation: {
      type: String,
      trim: true,
      default: "",
    },
    timeLimit: {
      type: Number,
      default: 15,
      min: 1,
      max: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ level: 1, category: 1, isActive: 1 });
questionSchema.index({ examTitle: 1 });

const Question = mongoose.model("Question", questionSchema);
export default Question;