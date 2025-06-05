import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import models from "../model.js"; // make sure this path matches your project layout

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// === Multer setup for file uploads ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const safeName = req.session.account?.username || "user";
    cb(null, safeName + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });


// === GET /users ===
router.get("/", (req, res) => {
  res.send("respond with a resource");
});

// === GET /users/auth-status ===
router.get("/auth-status", (req, res) => {
  res.json({
    isAuthenticated: !!req.session.isAuthenticated,
    username: req.session.account?.username || null,
    name: req.session.account?.name || null,
    profilePicture: req.session.account?.profilePicture || null,
  });
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

    user.name = req.body.name || user.name;
    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;

    if (req.file) {
      const profilePicPath = `/uploads/${req.file.filename}`;
      user.profilePicture = profilePicPath;
      req.session.account.profilePicture = profilePicPath;
    }

    await user.save();

    res.json({
      success: true,
      profilePicture: user.profilePicture,
    });
  } catch (err) {
    console.error("Profile update failed:", err);

    // Optional cleanup: remove file on error
    if (req.file) {
      const filePath = path.join(__dirname, "../public/uploads", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
