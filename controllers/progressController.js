import UserProgress from "../models/UserProgress.js";
import Lesson from "../models/Lesson.js";
import Section from "../models/Section.js";

/* ══════════════════════════════════════════════════════════════
   LESSON COMPLETE KARO
   POST /api/v1/lessons/:lessonId/complete
   Auth required
══════════════════════════════════════════════════════════════ */
export const completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id; // auth middleware se

    /* Lesson exist karti hai? */
    const lesson = await Lesson.findOne({ _id: lessonId, isActive: true });
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }

    /* Pehle check karo — kya previous lesson complete hui hai? */
    if (lesson.displayOrder > 1) {
      const prevLesson = await Lesson.findOne({
        section_id:   lesson.section_id,
        displayOrder: lesson.displayOrder - 1,
        isActive:     true,
      });

      if (prevLesson) {
        const prevCompleted = await UserProgress.findOne({
          user_id:   userId,
          lesson_id: prevLesson._id,
        });

        if (!prevCompleted) {
          return res.status(403).json({
            success: false,
            message: `Pehle "${prevLesson.lessonTitle}" complete karo`,
          });
        }
      }
    }

    /* Already complete? — idempotent response */
    const already = await UserProgress.findOne({ user_id: userId, lesson_id: lessonId });
    if (already) {
      return res.status(200).json({
        success:  true,
        message:  "Already completed",
        data:     already,
        alreadyDone: true,
      });
    }

    /* Progress save karo */
    const progress = await UserProgress.create({
      user_id:    userId,
      lesson_id:  lessonId,
      section_id: lesson.section_id,
      level_id:   lesson.level_id,
      xpEarned:   lesson.xpPoints,
    });

    res.status(201).json({
      success: true,
      message: `+${lesson.xpPoints} XP Earned! Lesson complete!`,
      data:    progress,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   LEVEL KA PROGRESS FETCH KARO
   GET /api/v1/levels/:levelId/progress
   Auth required
   Returns: completedLessonIds[], totalXP, completedCount
══════════════════════════════════════════════════════════════ */
export const getLevelProgress = async (req, res) => {
  try {
    const { levelId } = req.params;
    const userId = req.user._id;

    const progressList = await UserProgress.find({
      user_id:  userId,
      level_id: levelId,
    }).select("lesson_id xpEarned");

    const completedLessonIds = progressList.map((p) => p.lesson_id.toString());
    const totalXP = progressList.reduce((sum, p) => sum + (p.xpEarned || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        completedLessonIds,
        completedCount: completedLessonIds.length,
        totalXP,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};