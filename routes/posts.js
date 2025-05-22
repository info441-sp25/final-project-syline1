import express from "express";

var router = express.Router();

// Create a new post
router.post("/", async (req, res) => {
  console.log("POST /posts - Request received");
  console.log("Request body:", req.body);
  console.log("Session:", req.session);

  if (!req.session.isAuthenticated) {
    console.log("Not logged in: session is not authenticated");
    return res.status(401).json({
      status: "error",
      error: "not logged in",
    });
  }
  try {
    const { content } = req.body;
    const username = req.session.account.username;
    console.log("Authenticated user:", username);

    // Find or create user in your DB
    let user = await req.models.User.findOne({ email: username });
    if (!user) {
      console.log("User not found in DB, creating new user");
      user = await req.models.User.create({
        username: username,
        email: username,
      });
    } else {
      console.log("User found in DB:", user);
    }

    const newPost = new req.models.Post({
      content,
      author: user._id,
      createdAt: new Date(),
    });

    console.log("Attempting to save post:", newPost);
    await newPost.save();
    console.log("Post saved successfully:", newPost);
    res.json({ status: "success", post: newPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Get all posts
router.get("/", async (req, res) => {
  console.log("GET /posts - Request received");
  try {
    const posts = await req.models.Post.find()
      .populate("author", "username")
      .sort({ createdAt: -1 });
    console.log("Found posts:", posts);
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Delete a post
router.delete("/:postId", async (req, res) => {
  console.log("DELETE /posts - Request received");
  console.log("Post ID:", req.params.postId);
  console.log("Auth Context:", req.authContext);

  if (!req.authContext || !req.authContext.account) {
    console.log("No auth context or account found");
    return res
      .status(401)
      .json({ status: "error", error: "Not authenticated" });
  }

  try {
    const post = await req.models.Post.findById(req.params.postId);
    console.log("Found post:", post);

    if (!post) {
      console.log("Post not found");
      return res.status(404).json({ status: "error", error: "Post not found" });
    }

    // Get user
    const user = await req.models.User.findOne({
      email: req.authContext.account.username,
    });

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ status: "error", error: "User not found" });
    }

    if (post.author.toString() !== user._id.toString()) {
      console.log("User not authorized to delete post");
      return res.status(403).json({
        status: "error",
        error: "Not authorized to delete this post",
      });
    }

    await post.deleteOne();
    console.log("Post deleted successfully");
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

router.get("/debug-auth", (req, res) => {
  console.log("Session:", req.session);
  console.log("AuthContext:", req.authContext);
  res.json({
    session: {
      id: req.sessionID,
      isAuthenticated: req.session.isAuthenticated,
      account: req.session.account,
    },
    authContext: {
      account: req.authContext?.account,
    },
  });
});

export default router;
