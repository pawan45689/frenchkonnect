import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    examTitle: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },
    level: {
      type: String,
      required: [true, "Level is required"],
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      default: "A1",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
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