import Question from "../models/Question.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const uploadFile = async (file, folder = "questions") => {
  return await uploadToCloudinary(file.data, folder);
};

const parseBool = (val) => {
  if (typeof val === "boolean") return val;
  if (val === "true")  return true;
  if (val === "false") return false;
  return true;
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: Get all questions
══════════════════════════════════════════════════════════════ */
export const getAllQuestions = async (req, res) => {
  try {
    const page       = parseInt(req.query.page)  || 1;
    const limit      = parseInt(req.query.limit) || 10;
    const search     = req.query.search          || "";
    const levelId    = req.query.level           || "";
    const categoryId = req.query.category        || "";
    const isActive   = req.query.isActive;

    const query = {};
    if (search) {
      query.$or = [
        { question:  { $regex: search, $options: "i" } },
        { examTitle: { $regex: search, $options: "i" } },
      ];
    }
    if (levelId)    query.level    = levelId;
    if (categoryId) query.category = categoryId;
    if (isActive !== undefined && isActive !== "") {
      query.isActive = isActive === "true";
    }

    const total      = await Question.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const questions = await Question.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("level",    "levelName title")
      .populate("category", "sectionName");

    const stats = {
      total:    await Question.countDocuments(),
      active:   await Question.countDocuments({ isActive: true }),
      inactive: await Question.countDocuments({ isActive: false }),
      thisWeek: await Question.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    };

    res.status(200).json({ success: true, questions, totalPages, currentPage: page, total, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: Get single question
══════════════════════════════════════════════════════════════ */
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("level",    "levelName title")
      .populate("category", "sectionName");
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });
    res.status(200).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: Create question
══════════════════════════════════════════════════════════════ */
export const createQuestion = async (req, res) => {
  try {
    const {
      examTitle, level, category, question, questionType,
      optionType, correct, explanation, timeLimit,
      examType,                                          // ← NEW
      examDuration, introNote,
      isActive, order,
    } = req.body;

    if (!examTitle?.trim())  return res.status(400).json({ success: false, message: "Exam title is required" });
    if (!level)              return res.status(400).json({ success: false, message: "Level is required" });
    if (!category)           return res.status(400).json({ success: false, message: "Category is required" });
    if (!examDuration)       return res.status(400).json({ success: false, message: "Exam duration is required" });

    let options = [];
    try {
      options = typeof req.body.options === "string"
        ? JSON.parse(req.body.options)
        : (req.body.options || []);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid options format" });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: "At least 2 options required" });
    }

    const correctIdx = parseInt(correct);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
      return res.status(400).json({ success: false, message: "Correct answer index is out of range" });
    }

    let questionImage = "";
    if (req.files?.questionImage) {
      questionImage = await uploadFile(req.files.questionImage, "questions");
    }

    const questionText = question?.trim() || "";
    if (!questionText && !questionImage) {
      return res.status(400).json({ success: false, message: "Question must have either text or image" });
    }

    for (let i = 0; i < options.length; i++) {
      if (req.files?.[`optionImage_${i}`]) {
        options[i].image = await uploadFile(req.files[`optionImage_${i}`], "options");
      }
    }

    let explanationImage = "";
    if (req.files?.explanationImage) {
      explanationImage = await uploadFile(req.files.explanationImage, "explanations");
    }

    const newQuestion = await Question.create({
      examTitle:    examTitle.trim(),
      level,
      category,
      examType:     examType || "Practice",              // ← NEW
      examDuration: parseInt(examDuration),
      introNote:    introNote?.trim() || "",
      question:     questionText,
      questionImage,
      questionType: questionType || "text",
      options,
      optionType:   optionType || "text",
      correct:      correctIdx,
      explanation:  explanation?.trim() || "",
      explanationImage,
      timeLimit:    parseInt(timeLimit) || 15,
      isActive:     parseBool(isActive),
      order:        parseInt(order) || 0,
    });

    await newQuestion.populate("level",    "levelName title");
    await newQuestion.populate("category", "sectionName");

    res.status(201).json({ success: true, message: "Question created successfully", question: newQuestion });
  } catch (error) {
    console.error("createQuestion error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: Update question
══════════════════════════════════════════════════════════════ */
export const updateQuestion = async (req, res) => {
  try {
    const existing = await Question.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Question not found" });

    const updateData = { ...req.body };

    if (typeof updateData.options === "string") {
      try { updateData.options = JSON.parse(updateData.options); }
      catch { return res.status(400).json({ success: false, message: "Invalid options format" }); }
    }

    if (updateData.correct      !== undefined) updateData.correct      = parseInt(updateData.correct);
    if (updateData.timeLimit    !== undefined) updateData.timeLimit    = parseInt(updateData.timeLimit);
    if (updateData.examDuration !== undefined) updateData.examDuration = parseInt(updateData.examDuration);
    if (updateData.introNote    !== undefined) updateData.introNote    = updateData.introNote.trim();
    if (updateData.examType     !== undefined) updateData.examType     = updateData.examType;   // ← NEW
    if (updateData.order        !== undefined) updateData.order        = parseInt(updateData.order);
    if (updateData.isActive     !== undefined) updateData.isActive     = parseBool(updateData.isActive);
    if (updateData.question     !== undefined) updateData.question     = updateData.question.trim();

    if (req.files?.questionImage) {
      await deleteFromCloudinary(existing.questionImage);
      updateData.questionImage = await uploadFile(req.files.questionImage, "questions");
    } else if (updateData.removeQuestionImage === "true") {
      await deleteFromCloudinary(existing.questionImage);
      updateData.questionImage = "";
    }
    delete updateData.removeQuestionImage;

    if (Array.isArray(updateData.options)) {
      for (let i = 0; i < updateData.options.length; i++) {
        if (req.files?.[`optionImage_${i}`]) {
          await deleteFromCloudinary(existing.options[i]?.image);
          updateData.options[i].image = await uploadFile(req.files[`optionImage_${i}`], "options");
        }
      }
    }

    if (req.files?.explanationImage) {
      await deleteFromCloudinary(existing.explanationImage);
      updateData.explanationImage = await uploadFile(req.files.explanationImage, "explanations");
    } else if (updateData.removeExplanationImage === "true") {
      await deleteFromCloudinary(existing.explanationImage);
      updateData.explanationImage = "";
    }
    delete updateData.removeExplanationImage;

    const updated = await Question.findByIdAndUpdate(
      req.params.id, updateData, { new: true, runValidators: true }
    )
      .populate("level",    "levelName title")
      .populate("category", "sectionName");

    res.status(200).json({ success: true, message: "Question updated successfully", question: updated });
  } catch (error) {
    console.error("updateQuestion error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: Delete question
══════════════════════════════════════════════════════════════ */
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    await deleteFromCloudinary(question.questionImage);
    await deleteFromCloudinary(question.explanationImage);
    for (const opt of question.options || []) {
      await deleteFromCloudinary(opt.image);
    }

    await Question.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: Toggle status
══════════════════════════════════════════════════════════════ */
export const toggleStatus = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });
    question.isActive = !question.isActive;
    await question.save();
    res.status(200).json({
      success:  true,
      message:  `Question ${question.isActive ? "activated" : "deactivated"} successfully`,
      isActive: question.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   PUBLIC: Get exam questions
   — examType filter add kiya ← NEW
══════════════════════════════════════════════════════════════ */
export const getExamQuestions = async (req, res) => {
  try {
    const { level, category, examType } = req.query;   // ← examType added
    const query = { isActive: true };
    if (level)    query.level    = level;
    if (category) query.category = category;
    if (examType) query.examType = examType;            // ← NEW filter

    const questions = await Question.find(query)
      .sort({ order: 1, createdAt: 1 })
      .populate("level",    "levelName title")
      .populate("category", "sectionName")
      .select("-createdAt -updatedAt -__v");

    const examDuration = questions[0]?.examDuration ?? null;
    const introNote    = questions[0]?.introNote    ?? "";
    const examTitle    = questions[0]?.examTitle    ?? "";

    const sanitized = questions.map((q) => ({
      id:            q._id,
      examTitle:     q.examTitle,
      examType:      q.examType,                        // ← NEW — frontend ke liye
      level:         q.level,
      category:      q.category,
      question:      q.question,
      questionImage: q.questionImage,
      questionType:  q.questionType,
      options:       q.options,
      optionType:    q.optionType,
      timeLimit:     q.timeLimit,
    }));

    res.status(200).json({
      success: true,
      questions: sanitized,
      total:    sanitized.length,
      examDuration,
      introNote,
      examTitle,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   PUBLIC: Submit exam — same as before
══════════════════════════════════════════════════════════════ */
export const submitExam = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "Answers are required" });
    }

    const questions = await Question.find({ _id: { $in: answers.map(a => a.questionId) } });
    let score = 0;

    const results = answers.map((answer) => {
      const q = questions.find(q => q._id.toString() === answer.questionId);
      if (!q) return { questionId: answer.questionId, isCorrect: false };

      const isCorrect = answer.selectedIndex === q.correct;
      if (isCorrect) score++;

      const selIdx = answer.selectedIndex;
      const getOptDisplay = (opt) =>
        !opt ? "Not answered" : opt.text || opt.label || opt.image || "—";

      return {
        questionId:       answer.questionId,
        question:         q.question,
        questionImage:    q.questionImage,
        questionType:     q.questionType,
        selectedIndex:    selIdx,
        correctIndex:     q.correct,
        correctAnswer:    getOptDisplay(q.options[q.correct]),
        yourAnswer:       selIdx !== undefined && selIdx >= 0
          ? getOptDisplay(q.options[selIdx])
          : "Not answered",
        isCorrect,
        explanation:      q.explanation,
        explanationImage: q.explanationImage,
        correctOption:    q.options[q.correct],
        selectedOption:   selIdx >= 0 ? (q.options[selIdx] ?? null) : null,
      };
    });

    res.status(200).json({
      success:    true,
      score,
      total:      questions.length,
      percentage: questions.length > 0 ? Math.round((score / questions.length) * 100) : 0,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: Stats
══════════════════════════════════════════════════════════════ */
export const getStats = async (req, res) => {
  try {
    const stats = {
      total:    await Question.countDocuments(),
      active:   await Question.countDocuments({ isActive: true }),
      inactive: await Question.countDocuments({ isActive: false }),
      thisWeek: await Question.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      byLevel: await Question.aggregate([
        { $lookup: { from: "levels", localField: "level", foreignField: "_id", as: "levelInfo" } },
        { $unwind: { path: "$levelInfo", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$level", levelName: { $first: "$levelInfo.levelName" }, count: { $sum: 1 } } },
        { $sort: { levelName: 1 } },
      ]),
      /* ── NEW: by examType ── */
      byExamType: await Question.aggregate([
        { $group: { _id: "$examType", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      withQuestionImage: await Question.countDocuments({ questionImage: { $ne: "" } }),
      withImageOptions:  await Question.countDocuments({ optionType: "image" }),
    };
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};