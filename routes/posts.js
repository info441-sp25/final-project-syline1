import express from 'express';

const router = express.Router();

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    const author = req.user._id;
    const post = new Post({
      author,
      content
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all posts
<<<<<<< HEAD
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
=======
router.get("/", async (req, res) => {
  console.log("GET /posts - fetching posts from last 24 hours");
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const posts = await req.models.Post.find({ createdAt: { $gte: oneDayAgo } })
      .populate("author", "username")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching recent posts:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});


// Delete a post
router.delete('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 