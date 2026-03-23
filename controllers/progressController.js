import UserProgress from "../models/UserProgress.js";
import Lesson from "../models/Lesson.js";
import User from "../models/userModel.js";

/* ══════════════════════════════════════════════════════════════
   LESSON COMPLETE KARO
   POST /api/v1/lessons/:lessonId/complete
   Auth required
══════════════════════════════════════════════════════════════ */
export const completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    const lesson = await Lesson.findOne({ _id: lessonId, isActive: true });
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }

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
            message: `Complete "${prevLesson.lessonTitle}" first`,
          });
        }
      }
    }

    // Already complete check
    const already = await UserProgress.findOne({
      user_id:   userId,
      lesson_id: lessonId,
    });
    if (already) {
      return res.status(200).json({
        success:     true,
        message:     "Already completed",
        data:        already,
        alreadyDone: true,
      });
    }

    // Progress save karo
    const progress = await UserProgress.create({
      user_id:    userId,
      lesson_id:  lessonId,
      section_id: lesson.section_id,
      level_id:   lesson.level_id,
      xpEarned:   lesson.xpPoints,
    });

    // ✅ User ka totalXP + dailyXP + streak update karo
    const today     = new Date();
    const todayDate = today.toDateString();

    const user = await User.findById(userId);

    // dailyXP calculate
    let newDailyXP = lesson.xpPoints;
    if (user.dailyXPDate) {
      const lastDate = new Date(user.dailyXPDate).toDateString();
      if (lastDate === todayDate) {
        // Aaj already kuch XP mila tha — add karo
        newDailyXP = (user.dailyXP || 0) + lesson.xpPoints;
      }
      // Naya din — sirf is lesson ka XP
    }

    // Streak calculate
    let newStreak = user.streak || 0;
    if (user.lastStreakDate) {
      const lastStreakDay = new Date(user.lastStreakDate).toDateString();
      const yesterday     = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toDateString();

      if (lastStreakDay === todayDate) {
        // Aaj already streak update hua — kuch mat karo
      } else if (lastStreakDay === yesterdayDate) {
        // Kal tha — streak badhao
        newStreak = newStreak + 1;
      } else {
        // Gap — reset
        newStreak = 1;
      }
    } else {
      // Pehli baar
      newStreak = 1;
    }

    // ✅ User update
    await User.findByIdAndUpdate(userId, {
      totalXP:        (user.totalXP || 0) + lesson.xpPoints,
      dailyXP:        newDailyXP,
      dailyXPDate:    today,
      streak:         newStreak,
      lastStreakDate: today,
    });

    res.status(201).json({
      success:    true,
      message:    `+${lesson.xpPoints} XP Earned! Lesson complete!`,
      data:       progress,
      xpEarned:   lesson.xpPoints,
      newTotalXP: (user.totalXP || 0) + lesson.xpPoints,
      newStreak,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   LEVEL KA PROGRESS FETCH KARO
   GET /api/v1/levels/:levelId/progress
   Auth required
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