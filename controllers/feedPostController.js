import FeedPost from "../models/feedPostModel.js";

// ── PUBLIC ──────────────────────────────────────────────────

// GET /api/v1/feed
// GET /api/v1/feed — views increment on fetch
export const getFeedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    const total = await FeedPost.countDocuments(query);
    const posts = await FeedPost.find(query)
      .populate("author", "fullName email avatar")
      .sort({ pinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // ✅ views increment — fetched posts ke IDs
    const ids = posts.map(p => p._id);
    await FeedPost.updateMany({ _id: { $in: ids } }, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/feed — login required
export const createFeedPost = async (req, res) => {
  try {
    const { text, course } = req.body;
    if (!text?.trim())
      return res.status(400).json({ success: false, message: "Text is required" });

    const post = await FeedPost.create({
      text,
      course: course || "Community",
      author: req.user._id,
    });

    const populated = await post.populate("author", "fullName email avatar");
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/feed/:id/like — login required
export const toggleLike = async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const userId   = req.user._id.toString();
    const liked    = post.likes.map(id => id.toString()).includes(userId);

    if (liked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ success: true, liked: !liked, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN ────────────────────────────────────────────────────

// GET /api/v1/admin/feed
export const adminGetFeedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = {};
    if (search) query.text = { $regex: search, $options: "i" };

    const total = await FeedPost.countDocuments(query);
    const posts = await FeedPost.find(query)
      .populate("author", "fullName email")
      .sort({ pinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: posts,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/admin/feed/:id
export const adminDeleteFeedPost = async (req, res) => {
  try {
    const post = await FeedPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/admin/feed/:id/pin
export const adminTogglePin = async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    post.pinned = !post.pinned;
    await post.save();
    res.json({ success: true, pinned: post.pinned, message: `Post ${post.pinned ? "pinned" : "unpinned"}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET /api/v1/community/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await FeedPost.aggregate([
      { $match: { isActive: true } },
      
      // Author ke basis pe group karo — post count aur likes count
      {
        $group: {
          _id: "$author",
          postCount: { $sum: 1 },
          totalLikes: { $sum: { $size: "$likes" } },
        }
      },

      // Sabse zyada posts wale pehle
      { $sort: { postCount: -1 } },

      // Top 5 hi
      { $limit: 5 },

      // User details fetch karo
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        }
      },
      { $unwind: "$user" },

      // Sirf zaruri fields
      {
        $project: {
          _id: 1,
          postCount: 1,
          totalLikes: 1,
          "user.fullName": 1,
          "user.avatar": 1,
        }
      }
    ]);

    res.json({ success: true, data: leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};