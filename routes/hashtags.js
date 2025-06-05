import express from "express";
import models from "../model.js";
const router = express.Router();

// GET /hashtags - return trending hashtags
router.get("/", async (req, res) => {
  try {
    const hashtags = await models.Hashtag.find().sort({ count: -1, lastUsed: -1 }).limit(10);
    res.json({ hashtags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
