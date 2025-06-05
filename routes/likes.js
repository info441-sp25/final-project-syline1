import express from "express";
import models from "../model.js";
const router = express.Router();

// POST /likes - toggle like/unlike
router.post("/", async (req, res) => {
  try {
    const { postID, action } = req.body;
    const user = await models.User.findOne({ email: req.session.account.email });
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const post = await models.Post.findById(postID);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = user._id.toString();

    if (action === "like") {
      if (!post.upvotedBy.includes(userId)) {
        post.upvotes += 1;
        post.upvotedBy.push(userId);
      }
    } else if (action === "unlike") {
      if (post.upvotedBy.includes(userId)) {
        post.upvotes -= 1;
        post.upvotedBy = post.upvotedBy.filter(id => id.toString() !== userId);
      }
    }

    await post.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
