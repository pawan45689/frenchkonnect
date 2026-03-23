import User         from "../models/userModel.js";
import ExamAttempt  from "../models/ExamAttempt.js";
import UserProgress from "../models/UserProgress.js";
import Section      from "../models/Section.js";
import Lesson       from "../models/Lesson.js";
import Level        from "../models/Level.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. User fetch
    const user = await User.findById(userId)
      .select("-password -resetPasswordOTP -resetPasswordOTPExpire")
      .populate("currentLevel", "levelName title")
      .populate({
        path:     "lastAccessedLesson",
        select:   "level_id section_id lessonTitle",
        populate: [
          { path: "level_id",   select: "levelName title" },
          { path: "section_id", select: "sectionName" },
        ],
      });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Active level decide karo
    let activeLevelId   = null;
    let activeLevelInfo = null;

    if (user.lastAccessedLesson?.level_id) {
      activeLevelId   = user.lastAccessedLesson.level_id._id;
      activeLevelInfo = user.lastAccessedLesson.level_id;
    } else if (user.currentLevel) {
      activeLevelId   = user.currentLevel._id;
      activeLevelInfo = user.currentLevel;
    } else {
      const firstLevel = await Level.findOne({ isActive: true })
        .sort({ displayOrder: 1 })
        .select("levelName title");
      if (firstLevel) {
        activeLevelId   = firstLevel._id;
        activeLevelInfo = firstLevel;
      }
    }

    // 3. Daily XP reset check
    const today     = new Date();
    const todayDate = today.toDateString();
    let dailyXP     = user.dailyXP || 0;

    if (user.dailyXPDate) {
      const lastDate = new Date(user.dailyXPDate).toDateString();
      if (lastDate !== todayDate) {
        dailyXP = 0;
        await User.findByIdAndUpdate(userId, {
          dailyXP:     0,
          dailyXPDate: today,
        });
      }
    }

    // 4. Level progress
    let levelProgress = { completedCount: 0, totalLessons: 0, percentage: 0 };

    if (activeLevelId) {
      const totalLessons = await Lesson.countDocuments({
        level_id: activeLevelId,
        isActive: true,
      });

      const completedCount = await UserProgress.countDocuments({
        user_id:  userId,
        level_id: activeLevelId,
      });

      const percentage = totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;

      levelProgress = { completedCount, totalLessons, percentage };
    }

    // 5. Sections + lessons
    let sections = [];

    if (activeLevelId) {
      const rawSections = await Section.find({
        level_id: activeLevelId,
        isActive: true,
      }).sort({ displayOrder: 1 });

      const progressList = await UserProgress.find({
        user_id:  userId,
        level_id: activeLevelId,
      }).select("lesson_id");

      const completedIds = new Set(
        progressList.map((p) => p.lesson_id.toString())
      );

      sections = await Promise.all(
        rawSections.map(async (sec) => {
          const lessons = await Lesson.find({
            section_id: sec._id,
            isActive:   true,
          })
            .sort({ displayOrder: 1 })
            .select("-contentBlocks");

          const lessonsWithProgress = lessons.map((l) => ({
            ...l.toObject(),
            isCompleted: completedIds.has(l._id.toString()),
          }));

          return { ...sec.toObject(), lessons: lessonsWithProgress };
        })
      );
    }

    // 6. Last exam attempt
    const lastExam = await ExamAttempt.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate("levelId",   "levelName title")
      .populate("sectionId", "sectionName")
      .lean();

    // 7. Leaderboard top 5
    const topUsers = await User.find({ role: "user" })
      .sort({ totalXP: -1 })
      .limit(5)
      .select("fullName avatar totalXP");

    const usersAhead = await User.countDocuments({
      role:    "user",
      totalXP: { $gt: user.totalXP || 0 },
    });
    const userRank = usersAhead + 1;

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id:                user._id,
          fullName:           user.fullName           || "",
          email:              user.email              || "",
          mobile:             user.mobile             || "",
          username:           user.username           || "",
          phone:              user.phone              || "",
          bio:                user.bio                || "",
          avatar:             user.avatar             || "",
          role:               user.role,
          createdAt:          user.createdAt,
          currentLevel:       activeLevelInfo,
          streak:             user.streak             || 0,
          totalXP:            user.totalXP            || 0,
          dailyXP,
          dailyXPGoal:        user.dailyXPGoal        || 500,
          fluencyScore:       user.fluencyScore       || 0,
          lastAccessedLesson: user.lastAccessedLesson || null,
        },
        levelProgress,
        sections,
        lastExam:    lastExam || null,
        leaderboard: { topUsers, userRank },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};