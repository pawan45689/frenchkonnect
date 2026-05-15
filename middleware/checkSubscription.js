import Lesson from "../models/Lesson.js";
import Level from "../models/Level.js";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";

/**
 * checkSubscription middleware
 * - Checks if the lesson's level is free → allow
 * - If paid, checks if user has an ACTIVE (non-expired) subscription for that plan
 * - If subscription expired → lock the level, update user.purchasedPlans
 */
const checkSubscription = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    // 1. Get the lesson with its level
    const lesson = await Lesson.findById(lessonId).populate({
      path:   "section_id",
      populate: { path: "level_id" },
    });

    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }

    const level = lesson.section_id?.level_id;
    if (!level) {
      return res.status(404).json({ success: false, message: "Level not found" });
    }

    // 2. Free level → allow immediately
    if (level.isFree) return next();

    // 3. Paid level — check planKey
    const requiredPlan = level.planKey; // "tef" | "tcf" | "combo"

    // 4. Check DB for active subscription (not just user.purchasedPlans)
    const now = new Date();
    const activeSub = await Subscription.findOne({
      user:    userId,
      status:  "active",
      expiresAt: { $gt: now },
      $or: [
        { planKey: requiredPlan },
        { planKey: "combo" },          // combo unlocks everything
      ],
    });

    if (activeSub) {
      return next(); // ✅ Has valid subscription
    }

    // 5. No active subscription — check if they had one that expired
    const expiredSub = await Subscription.findOne({
      user:    userId,
      planKey: { $in: [requiredPlan, "combo"] },
      status:  { $in: ["active", "expired"] },
    }).sort({ expiresAt: -1 });

    // If expired, sync user.purchasedPlans (remove expired plan)
    if (expiredSub && expiredSub.expiresAt < now) {
      // Mark as expired
      if (expiredSub.status === "active") {
        expiredSub.status = "expired";
        await expiredSub.save();
      }
      // Remove from user.purchasedPlans
      await User.findByIdAndUpdate(userId, {
        $pull: { purchasedPlans: requiredPlan },
      });

      return res.status(403).json({
        success:   false,
        message:   `Your ${requiredPlan.toUpperCase()} plan expired on ${expiredSub.expiresAt.toDateString()}. Please renew to continue.`,
        expired:   true,
        expiredAt: expiredSub.expiresAt,
        planKey:   requiredPlan,
      });
    }

    // 6. Never subscribed
    return res.status(403).json({
      success:  false,
      message:  `This level requires the ${requiredPlan.toUpperCase()} plan. Please subscribe to access.`,
      locked:   true,
      planKey:  requiredPlan,
    });
  } catch (error) {
    console.error("checkSubscription error:", error);
    res.status(500).json({ success: false, message: "Subscription check failed" });
  }
};

export default checkSubscription;