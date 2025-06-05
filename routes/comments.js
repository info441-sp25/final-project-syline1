import express from "express";
import models from "../model.js";
const router = express.Router();

// POST /comments - add a new comment
router.post("/", async (req, res) => {
  try {
    const { postID, content } = req.body;
    const user = await models.User.findOne({ email: req.session.account.email });
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const post = await models.Post.findById(postID);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({
      author: user._id,
      content,
      timestamp: new Date()
    });

    await post.save();
    res.json({ success: true, message: "Comment added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
