import mongoose from 'mongoose';
const models = {}

console.log("connecting to mongodb");

await mongoose.connect(
  "mongodb+srv://jiawu123:Wujia2013@experiment.mgi9s7d.mongodb.net/Blinkfeed"
);

console.log("successfully connected to mongodb!");

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

models.User = mongoose.model('User', userSchema);
// Post Schema
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

models.Post = mongoose.model('Post', postSchema);
export default models