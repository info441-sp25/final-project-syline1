# BlinkFeed

**Team Members:** Shaaz Charania, Sophia Ylinen, Jia Wu, Taise Nish  
**Project Type:** Microblogging Web App  
**Deployment:** Azure  

---

## Project Description

**BlinkFeed** is a microblogging platform for university students and young professionals who want a relaxed, low-stakes space to share spontaneous thoughts, ideas, and updates.

Unlike traditional platforms like X or Threads, which preserve posts indefinitely, BlinkFeed introduces ephemeral microblogging: every post auto-expires after 24 hours. This promotes genuine, in-the-moment sharing without long-term digital consequences.

Users no longer need to polish their online identity. Instead, BlinkFeed offers a carefree, low-pressure environment to be candid, creative, and authentic—knowing everything they share is temporary.

### Why We're Building It

As developers, we’re excited to work on BlinkFeed because it blends:

- Meaningful user impact — responding to growing demand for impermanence in social media  
- Technical depth — integrating user auth, post expiration via TTL indexing, and secure deployment  
- Creativity and empathy — designing for stress-free, real-time experiences  

---

## Technical Overview

### Core Features (P0 Priority)

| User Role       | User Story                                      | Technical Implementation                                     |
|-----------------|--------------------------------------------------|--------------------------------------------------------------|
| Visitor         | I want to register.                              | `POST /register` with Azure login                            |
| Registered User | I want to log in.                                | `POST /login` → session or JWT                               |
| Registered User | I want to create a microblog.                    | `POST /posts` → save with TTL in MongoDB                     |
| Registered User | I want to view posts from the last 24 hours.     | `GET /posts` → query sorted by timestamp                     |
| Registered User | I want to delete my own post.                    | `DELETE /posts/:postId` with ownership verification          |

### Additional Features

| Priority | User Role       | User Story                                         | Technical Implementation                                                  |
|----------|------------------|----------------------------------------------------|----------------------------------------------------------------------------|
| P1       | Registered User | I want to upvote/downvote posts.                  | `POST /posts/:postId/reactions`                                           |
| P1       | Registered User | I want to view my profile and posts.              | `GET /users/:username`                                                    |
| P1       | Registered User | I want to comment on posts.                       | `POST /posts/:postId/comments` → append to post's comments array          |
| P1       | Registered User | I want to view all comments on a post.            | `GET /posts/:postId/comments`                                             |
| P1       | Registered User | I want to see trending hashtags.                  | `GET /trending` → MongoDB aggregation pipeline to return top hashtags     |

---

## API Endpoints

| Method | Endpoint                       | Purpose                                       |
|--------|--------------------------------|-----------------------------------------------|
| POST   | `/register`                   | Register a new user with hashed password      |
| POST   | `/login`                      | Log in and start session or issue JWT         |
| POST   | `/posts`                      | Create a new post with expiration time        |
| GET    | `/posts`                      | Retrieve non-expired posts                    |
| DELETE | `/posts/:postId`             | Delete a post (auth required)                 |
| POST   | `/posts/:postId/upvote`      | Upvote a post                                 |
| POST   | `/posts/:postId/downvote`    | Downvote a post                               |
| GET    | `/users/:username`           | View user profile and posts                   |
| POST   | `/posts/:postId/comments`    | Comment on a post                             |
| GET    | `/posts/:postId/comments`    | View all comments on a post                   |
| GET    | `/trending`                  | View trending hashtags                        |

---

## Database Schemas

### User Schema
```js
{
  _id: ObjectId,
  username: String,
  email: String,
  createdAt: Date
}
```

### post schema
```js
{
  _id: ObjectId,
  author: ObjectId,
  content: String,
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  comments: [
    {
      author: ObjectId,
      content: String,
      timestamp: Date
    }
  ]
}
```
---
## Architecture Diagram
[View system architecture diagram](https://miro.com/app/board/uXjVI5R1ZAQ=/)
