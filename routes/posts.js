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

    // Extract hashtags from content
    const hashtags = content.match(/#[\w]+/g) || [];
    const cleanHashtags = hashtags.map(tag => tag.toLowerCase());

    const newPost = new req.models.Post({
      content,
      author: user._id,
      createdAt: new Date(),
      hashtags: cleanHashtags
    });

    // Update hashtag counts
    for (const tag of cleanHashtags) {
      await req.models.Hashtag.findOneAndUpdate(
        { tag },
        { $inc: { count: 1 }, lastUsed: new Date() },
        { upsert: true }
      );
    }

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

// Add route for trending hashtags
router.get("/trending", async (req, res) => {
  try {
    const trendingHashtags = await req.models.Hashtag.find()
      .sort({ count: -1, lastUsed: -1 })
      .limit(10);
    
    res.json(trendingHashtags);
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Add route to get posts by hashtag
router.get("/hashtag/:tag", async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase();
    const posts = await req.models.Post.find({ hashtags: tag })
      .populate("author", "username")
      .populate("comments.author", "username")
      .sort({ createdAt: -1 });

    // If user is logged in, include their vote status for each post
    let userVotes = {};
    if (req.session.isAuthenticated) {
      const username = req.session.account.username;
      const user = await req.models.User.findOne({ email: username });
      if (user) {
        posts.forEach(post => {
          if (post.upvotedBy.includes(user._id)) {
            userVotes[post._id] = 'up';
          } else if (post.downvotedBy.includes(user._id)) {
            userVotes[post._id] = 'down';
          }
        });
      }
    }

    const postsWithVotes = posts.map(post => ({
      ...post.toObject(),
      userVote: userVotes[post._id] || null
    }));
    
    res.json(postsWithVotes);
  } catch (error) {
    console.error("Error fetching posts by hashtag:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Add a comment to a post
router.post("/:postId/comments", async (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({
      status: "error",
      error: "not logged in",
    });
  }

  try {
    const { content } = req.body;
    const username = req.session.account.username;

    // Find or create user
    let user = await req.models.User.findOne({ email: username });
    if (!user) {
      user = await req.models.User.create({
        username: username,
        email: username,
      });
    }

    const post = await req.models.Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ status: "error", error: "Post not found" });
    }

    const comment = {
      author: user._id,
      content: content,
      timestamp: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the author information for the new comment
    const populatedPost = await req.models.Post.findById(post._id)
      .populate("comments.author", "username");

    res.json({
      status: "success",
      comment: populatedPost.comments[populatedPost.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Upvote a post
router.post("/:postId/upvote", async (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({
      status: "error",
      error: "not logged in",
    });
  }

  try {
    // Get the current user
    const username = req.session.account.username;
    let user = await req.models.User.findOne({ email: username });
    if (!user) {
      user = await req.models.User.create({
        username: username,
        email: username,
      });
    }

    const post = await req.models.Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ status: "error", error: "Post not found" });
    }

    // Check if user has already voted
    const hasUpvoted = post.upvotedBy.includes(user._id);
    const hasDownvoted = post.downvotedBy.includes(user._id);

    if (hasUpvoted) {
      // Remove upvote
      post.upvotes = Math.max(0, post.upvotes - 1);
      post.upvotedBy = post.upvotedBy.filter(id => !id.equals(user._id));
    } else {
      // Add upvote
      if (hasDownvoted) {
        // Remove downvote first
        post.downvotes = Math.max(0, post.downvotes - 1);
        post.downvotedBy = post.downvotedBy.filter(id => !id.equals(user._id));
      }
      post.upvotes = (post.upvotes || 0) + 1;
      post.upvotedBy.push(user._id);
    }

    await post.save();

    res.json({ 
      status: "success", 
      upvotes: post.upvotes, 
      downvotes: post.downvotes,
      userVote: hasUpvoted ? null : 'up'  // Tell client if user has voted
    });
  } catch (error) {
    console.error("Error upvoting post:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Downvote a post
router.post("/:postId/downvote", async (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({
      status: "error",
      error: "not logged in",
    });
  }

  try {
    // Get the current user
    const username = req.session.account.username;
    let user = await req.models.User.findOne({ email: username });
    if (!user) {
      user = await req.models.User.create({
        username: username,
        email: username,
      });
    }

    const post = await req.models.Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ status: "error", error: "Post not found" });
    }

    // Check if user has already voted
    const hasUpvoted = post.upvotedBy.includes(user._id);
    const hasDownvoted = post.downvotedBy.includes(user._id);

    if (hasDownvoted) {
      // Remove downvote
      post.downvotes = Math.max(0, post.downvotes - 1);
      post.downvotedBy = post.downvotedBy.filter(id => !id.equals(user._id));
    } else {
      // Add downvote
      if (hasUpvoted) {
        // Remove upvote first
        post.upvotes = Math.max(0, post.upvotes - 1);
        post.upvotedBy = post.upvotedBy.filter(id => !id.equals(user._id));
      }
      post.downvotes = (post.downvotes || 0) + 1;
      post.downvotedBy.push(user._id);
    }

    await post.save();

    res.json({ 
      status: "success", 
      upvotes: post.upvotes, 
      downvotes: post.downvotes,
      userVote: hasDownvoted ? null : 'down'  // Tell client if user has voted
    });
  } catch (error) {
    console.error("Error downvoting post:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Get comments for a post
router.get("/:postId/comments", async (req, res) => {
  try {
    const post = await req.models.Post.findById(req.params.postId)
      .populate("comments.author", "username");
    
    if (!post) {
      return res.status(404).json({ status: "error", error: "Post not found" });
    }

    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

export default router;
