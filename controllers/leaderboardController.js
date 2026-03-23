import User from "../models/userModel.js";

export const getLeaderboard = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const total = await User.countDocuments({ role: "user" });

    const users = await User.find({ role: "user" })
      .sort({ totalXP: -1 })
      .skip(skip)
      .limit(limit)
      .select("fullName avatar totalXP");

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};