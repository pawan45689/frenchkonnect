import ExamAttempt from "../models/ExamAttempt.js";

/* ══════════════════════════════════════════════════
   POST /api/v1/exam-attempts
══════════════════════════════════════════════════ */
export const saveAttempt = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      levelId, levelName, sectionId, sectionName,
      examType, examTitle, timeTaken,          // ← examTitle & timeTaken add kiye
      score, total, percentage, results,
    } = req.body;

    if (!sectionName || score == null || !total || percentage == null) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const attempt = await ExamAttempt.create({
      userId,
      levelId:    levelId    || null,
      levelName:  levelName  || "",
      sectionId:  sectionId  || null,
      sectionName,
      examType:   examType   || "Practice",
      examTitle:  examTitle  || "",            // ← NEW
      timeTaken:  timeTaken  || 0,             // ← NEW (seconds mein)
      score,
      total,
      percentage,
      results: results || [],
    });

    return res.status(201).json({ success: true, data: attempt });
  } catch (err) {
    console.error("saveAttempt error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/exam-attempts
   Normal user + Admin dono handle karta hai
══════════════════════════════════════════════════ */
export const getUserAttempts = async (req, res) => {
  try {
    const isAdmin = req.query.admin === "true";

    const filter = {};
    if (!isAdmin) {
      filter.userId = req.user._id;
    }

    if (req.query.examType) filter.examType  = req.query.examType;
    if (req.query.level)    filter.levelId   = req.query.level;
    if (req.query.category) filter.sectionId = req.query.category;

    if (req.query.date) {
      const start = new Date(req.query.date);
      const end   = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const total = await ExamAttempt.countDocuments(filter);

    const attempts = await ExamAttempt.find(filter)
      .populate("userId",    "name email")
      .populate("levelId",   "levelName")
      .populate("sectionId", "sectionName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const data = attempts.map(a => ({
      ...a,
      user:           a.userId,
      level:          a.levelId,
      category:       a.sectionId,
      totalQuestions: a.total,
      correctAnswers: a.score,
    }));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [tefCount, tcfCount, practiceCount, todayCount, avgArr] = await Promise.all([
      ExamAttempt.countDocuments({ ...filter, examType: "TEF Canada" }),
      ExamAttempt.countDocuments({ ...filter, examType: "TCF Canada" }),
      ExamAttempt.countDocuments({ ...filter, examType: "Practice"   }),
      ExamAttempt.countDocuments({ ...filter, createdAt: { $gte: todayStart } }),
      ExamAttempt.aggregate([
        { $match: filter },
        { $group: { _id: null, avg: { $avg: "$percentage" } } },
      ]),
    ]);

    return res.json({
      success:    true,
      data,
      attempts:   data,
      total,
      totalPages: Math.ceil(total / limit),
      stats: {
        tef:      tefCount,
        tcf:      tcfCount,
        practice: practiceCount,
        today:    todayCount,
        avgScore: avgArr[0] ? Math.round(avgArr[0].avg) : 0,
      },
    });
  } catch (err) {
    console.error("getUserAttempts error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/exam-attempts/summary
══════════════════════════════════════════════════ */
export const getAttemptSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const filter = { userId };
    if (req.query.levelId) filter.levelId = req.query.levelId;

    const all = await ExamAttempt.find(filter).sort({ createdAt: -1 }).lean();

    if (!all.length) {
      return res.json({
        success: true,
        data: { sections: {}, history: [], totalAttempts: 0, readiness: 0 },
      });
    }

    const sectionMap = {};
    for (const a of all) {
      if (!sectionMap[a.sectionName]) {
        sectionMap[a.sectionName] = {
          sectionName: a.sectionName,
          sectionId:   a.sectionId,
          latestScore: a.score,
          latestTotal: a.total,
          latestPct:   a.percentage,
          levelName:   a.levelName,
          attempts:    [],
        };
      }
      sectionMap[a.sectionName].attempts.push({
        score:      a.score,
        total:      a.total,
        percentage: a.percentage,
        date:       a.createdAt,
      });
    }

    const sections = Object.values(sectionMap);
    const avgPct   = sections.length
      ? Math.round(sections.reduce((s, x) => s + x.latestPct, 0) / sections.length)
      : 0;

    const last7 = all.slice(0, 7).map(a => a.percentage).reverse();

    return res.json({
      success: true,
      data: {
        readiness:     avgPct,
        totalAttempts: all.length,
        sections:      sectionMap,
        history:       last7,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════
   DELETE /api/v1/exam-attempts/:id
   Admin = koi bhi delete kar sakta hai
   Normal user = sirf apna
══════════════════════════════════════════════════ */
export const deleteAttempt = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";

    const query = isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };

    const attempt = await ExamAttempt.findOneAndDelete(query);
    if (!attempt) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }

    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/exam-attempts/admin/stats
══════════════════════════════════════════════════ */
export const getAdminStats = async (req, res) => {
  try {
    const filter = {};
    if (req.query.levelId) filter.levelId = req.query.levelId;

    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const types  = ["Practice", "TEF Canada", "TCF Canada"];
    const result = {};

    for (const type of types) {
      const typeFilter = { ...filter, examType: type };

      const [total, today, thisWeek, avgArr] = await Promise.all([
        ExamAttempt.countDocuments(typeFilter),
        ExamAttempt.countDocuments({ ...typeFilter, createdAt: { $gte: todayStart } }),
        ExamAttempt.countDocuments({ ...typeFilter, createdAt: { $gte: weekStart  } }),
        ExamAttempt.aggregate([
          { $match: typeFilter },
          { $group: { _id: null, avg: { $avg: "$percentage" } } },
        ]),
      ]);

      result[type] = {
        total,
        today,
        thisWeek,
        avgScore: avgArr[0] ? Math.round(avgArr[0].avg) : 0,
      };
    }

    const grandTotal = await ExamAttempt.countDocuments(filter);

    return res.json({ success: true, data: { ...result, grandTotal } });
  } catch (err) {
    console.error("getAdminStats error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};