import express from "express";
import multer from 'multer';

const upload = multer({ dest: 'uploads/' }); // Save uploaded files temporarily
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/auth-status", (req, res) => {
  res.json({
    isAuthenticated: !!req.session.isAuthenticated,
    username: req.session.account?.username || null,
    name: req.session.account?.name || null,
    profilePicture: req.session.account?.profilePicture || null,
  });
});

router.get('/me', async (req, res) => {
  try {
    if (!req.session.account || !req.session.account.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await req.models.User.findOne({ email: req.session.account.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const posts = await req.models.Post.find({
      author: user._id,
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 });

    res.json({
      user: {
        username: user.username,
        email: user.email,
        dateOfBirth: user.dateOfBirth || '',
        name: user.name || '',
        profilePicture: user.profilePicture || null
      },
      posts
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST route to update profile (name, DOB, profile pic)
router.post('/update-profile', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.session.account || !req.session.account.username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await req.models.User.findOne({ username: req.session.account.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.dateOfBirth) user.dateOfBirth = req.body.dateOfBirth;

    if (req.file) {
      const profilePicPath = `/uploads/${req.file.filename}`;
      user.profilePicture = profilePicPath;
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
