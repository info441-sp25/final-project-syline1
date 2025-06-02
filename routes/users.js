import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for permanent storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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
      // Delete old profile picture if it exists
      if (user.profilePicture) {
        const oldFilePath = path.join(process.cwd(), 'public', user.profilePicture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Save new profile picture path
      const profilePicPath = `/uploads/${req.file.filename}`;
      user.profilePicture = profilePicPath;
      req.session.account.profilePicture = profilePicPath;
    }

    await user.save();
    res.json({ 
      success: true,
      profilePicture: user.profilePicture
    });
  } catch (err) {
    console.error(err);
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      const filePath = path.join(process.cwd(), 'public', req.file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
