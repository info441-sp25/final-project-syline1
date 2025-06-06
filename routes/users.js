import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import models from "../model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// === Multer setup for file uploads ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../public/uploads");
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const safeName = req.session.account?.username?.replace(/[^a-zA-Z0-9]/g, '') || "user";
    cb(null, safeName + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// === Helper function to sync user with database ===
async function syncUserWithDatabase(sessionAccount) {
  try {
    if (!sessionAccount?.email) return null;
    
    let user = await models.User.findOne({ email: sessionAccount.email });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new models.User({
        username: sessionAccount.username,
        email: sessionAccount.email,
        name: sessionAccount.name,
        profilePicture: null
      });
      await user.save();
    }
    
    return user;
  } catch (error) {
    console.error('Error syncing user with database:', error);
    return null;
  }
}

// === GET /users ===
router.get("/", (req, res) => {
  res.send("respond with a resource");
});

// === GET /users/auth-status ===
router.get("/auth-status", async (req, res) => {
  try {
    if (req.session.account) {
      // Sync with database to get latest profile picture
      const user = await syncUserWithDatabase(req.session.account);
      
      if (user) {
        // Update session with database data
        req.session.account.profilePicture = user.profilePicture;
        req.session.save();
        
        return res.json({
          isAuthenticated: true,
          username: req.session.account.username,
          name: req.session.account.name,
          profilePicture: user.profilePicture,
        });
      }
      
      return res.json({
        isAuthenticated: true,
        username: req.session.account.username,
        name: req.session.account.name,
        profilePicture: req.session.account.profilePicture,
      });
    } else {
      return res.json({ isAuthenticated: false });
    }
  } catch (error) {
    console.error('Error in auth-status:', error);
    return res.json({ isAuthenticated: false });
  }
});

// === GET /users/me ===
router.get("/me", async (req, res) => {
  try {
    if (!req.session.account?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await models.User.findOne({ email: req.session.account.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const posts = await models.Post.find({
      author: user._id,
      createdAt: { $gte: oneDayAgo },
    }).sort({ createdAt: -1 });

    res.json({
      user: {
        username: user.username,
        email: user.email,
        dateOfBirth: user.dateOfBirth || "",
        name: user.name || "",
        profilePicture: user.profilePicture || null,
      },
      posts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// === POST /users/update-profile ===
router.post("/update-profile", upload.single("profilePicture"), async (req, res) => {
  try {
    const accountEmail = req.session.account?.email;
    if (!accountEmail) return res.status(401).json({ error: "Not authenticated" });

    const user = await models.User.findOne({ email: accountEmail });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Store old profile picture path for cleanup
    const oldProfilePicture = user.profilePicture;

    // Update user fields
    user.name = req.body.name || user.name;
    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;

    // Handle profile picture upload
    if (req.file) {
      const profilePicPath = `/uploads/${req.file.filename}`;
      user.profilePicture = profilePicPath;
      
      // Update session
      req.session.account.profilePicture = profilePicPath;
      
      // Clean up old profile picture if it exists and is not the default
      if (oldProfilePicture && oldProfilePicture.startsWith('/uploads/')) {
        const oldFilePath = path.join(__dirname, "../public", oldProfilePicture);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (cleanupError) {
            console.error('Error cleaning up old profile picture:', cleanupError);
          }
        }
      }
    }

    await user.save();
    
    // Save session changes
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
    });

    res.json({
      success: true,
      profilePicture: user.profilePicture,
      message: "Profile updated successfully"
    });
  } catch (err) {
    console.error("Profile update failed:", err);

    // Optional cleanup: remove file on error
    if (req.file) {
      const filePath = path.join(__dirname, "../public/uploads", req.file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.error('Error cleaning up file after error:', cleanupError);
        }
      }
    }

    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;