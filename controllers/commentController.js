import Comment   from "../models/commentModel.js";
import FeedPost  from "../models/feedPostModel.js";

// GET /api/v1/feed/:id/comments — public
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "fullName avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/feed/:id/comments — login required
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim())
      return res.status(400).json({ success: false, message: "Comment text required" });

    const post = await FeedPost.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    const comment = await Comment.create({
      text,
      author: req.user._id,
      post:   req.params.id,
    });

    // ✅ comments count increment
    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    const populated = await comment.populate("author", "fullName avatar");
    res.status(201).json({
      success: true,
      data: populated,
      commentsCount: post.commentsCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/feed/:postId/comments/:commentId — login required
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment)
      return res.status(404).json({ success: false, message: "Comment not found" });

    // Sirf apna comment delete kar sakta hai
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    await Comment.findByIdAndDelete(req.params.commentId);

    // ✅ comments count decrement
    await FeedPost.findByIdAndUpdate(req.params.postId, {
      $inc: { commentsCount: -1 }
    });

    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};