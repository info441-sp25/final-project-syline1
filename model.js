import mongoose from "mongoose";
const models = {};

console.log("connecting to mongodb");

await mongoose.connect(
  "mongodb+srv://jiawu123:Wujia2013@experiment.mgi9s7d.mongodb.net/Blinkfeed"
);

console.log("successfully connected to mongodb!");

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

models.User = mongoose.model("User", userSchema);
// Post Schema
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  hashtags: [{ type: String }], // Array of hashtags
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  comments: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

// Add TTL index to automatically delete posts after 24 hours
postSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 86400 seconds = 24 hours

// Create a schema for tracking hashtag usage
const hashtagSchema = new mongoose.Schema({
  tag: { type: String, required: true, unique: true },
  count: { type: Number, default: 1 },
  lastUsed: { type: Date, default: Date.now },
});

models.Post = mongoose.model("Post", postSchema);
models.Hashtag = mongoose.model("Hashtag", hashtagSchema);
export default models;
