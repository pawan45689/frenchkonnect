import Question from "../models/Question.js";

// ─── ADMIN: Get all questions (with pagination, search, filter) ───
export const getAllQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const level = req.query.level || "";
    const category = req.query.category || "";
    const isActive = req.query.isActive;

    const query = {};

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { examTitle: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (level) query.level = level;
    if (category) query.category = { $regex: category, $options: "i" };
    if (isActive !== undefined) query.isActive = isActive === "true";

    const total = await Question.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const questions = await Question.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const stats = {
      total: await Question.countDocuments(),
      active: await Question.countDocuments({ isActive: true }),
      inactive: await Question.countDocuments({ isActive: false }),
      thisWeek: await Question.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    };

    res.status(200).json({
      success: true,
      questions,
      totalPages,
      currentPage: page,
      total,
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Get single question ───
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    res.status(200).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Create question ───
export const createQuestion = async (req, res) => {
  try {
    const {
      examTitle,
      level,
      category,
      question,
      options,
      correct,
      explanation,
      timeLimit,
      isActive,
      order,
    } = req.body;

    if (correct < 0 || correct >= options.length) {
      return res.status(400).json({
        success: false,
        message: "Correct answer index is out of range",
      });
    }

    const newQuestion = await Question.create({
      examTitle,
      level,
      category,
      question,
      options,
      correct,
      explanation,
      timeLimit,
      isActive,
      order,
    });

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      question: newQuestion,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Update question ───
export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Delete question ───
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Toggle active status ───
export const toggleStatus = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    question.isActive = !question.isActive;
    await question.save();

    res.status(200).json({
      success: true,
      message: `Question ${question.isActive ? "activated" : "deactivated"} successfully`,
      isActive: question.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUBLIC: Get exam questions by level & category ───
export const getExamQuestions = async (req, res) => {
  try {
    const { level, category } = req.query;

    const query = { isActive: true };
    if (level) query.level = level;
    if (category) query.category = { $regex: category, $options: "i" };

    const questions = await Question.find(query)
      .sort({ order: 1, createdAt: 1 })
      .select("-createdAt -updatedAt -__v");

    // Correct answer index hide karo exam ke dauran
    const sanitized = questions.map((q) => ({
      id: q._id,
      examTitle: q.examTitle,
      level: q.level,
      category: q.category,
      question: q.question,
      options: q.options,
      timeLimit: q.timeLimit,
    }));

    res.status(200).json({
      success: true,
      questions: sanitized,
      total: sanitized.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUBLIC: Submit exam answers & get score ───
export const submitExam = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "Answers are required" });
    }

    const questionIds = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    let score = 0;
    const results = answers.map((answer) => {
      const q = questions.find((q) => q._id.toString() === answer.questionId);
      if (!q) return { questionId: answer.questionId, correct: false };

      const isCorrect = answer.selectedIndex === q.correct;
      if (isCorrect) score++;

      return {
        questionId: answer.questionId,
        question: q.question,
        selectedIndex: answer.selectedIndex,
        correctIndex: q.correct,
        correctAnswer: q.options[q.correct],
        yourAnswer: q.options[answer.selectedIndex] ?? "Not answered",
        isCorrect,
        explanation: q.explanation,
      };
    });

    res.status(200).json({
      success: true,
      score,
      total: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Get stats only ───
export const getStats = async (req, res) => {
  try {
    const stats = {
      total: await Question.countDocuments(),
      active: await Question.countDocuments({ isActive: true }),
      inactive: await Question.countDocuments({ isActive: false }),
      thisWeek: await Question.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      byLevel: await Question.aggregate([
        { $group: { _id: "$level", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    };
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};