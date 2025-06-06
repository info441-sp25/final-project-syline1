import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import sessions from "express-session";
import WebAppAuthProvider from "msal-node-wrapper";
import models from "./model.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Routers
import usersRouter from "./routes/users.js";
import postsRouter from "./routes/posts.js";
import commentsRouter from "./routes/comments.js";
import likesRouter from "./routes/likes.js";
import hashtagsRouter from "./routes/hashtags.js";

const authConfig = {
  auth: {
    clientId: "3a10cefa-4921-42e0-a946-6dfeb05857d1",
    authority: "https://login.microsoftonline.com/f6b6dd5b-f02f-441a-99a0-162ac5060bd2",
    clientSecret: "nhU8Q~97jEDJrilV7AkbSGfX4N.ay4-wLOKXJb8F",
    redirectUri: "/redirect",
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.enable("trust proxy");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Mongo models
app.use((req, res, next) => {
  req.models = models;
  next();
});

// Session
app.use(sessions({
  secret: "this is some secret key I am making up 093u4oih54lkndso8y43hewrdskjf",
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
  resave: false,
}));

// Auth setup
const authProvider = await WebAppAuthProvider.WebAppAuthProvider.initialize(authConfig);
app.use(authProvider.authenticate());

// Enhanced user session handling with database sync
app.use(async (req, res, next) => {
  const claims = req.session.account?.idTokenClaims;
  if (claims) {
    const username = claims.preferred_username || claims.name;
    const email = claims.email || claims.preferred_username;
    const name = claims.name;

    try {
      // Find or create user in database
      let user = await models.User.findOne({ email: email });
      
      if (!user) {
        // Create new user if doesn't exist
        user = new models.User({
          username: username,
          email: email,
          name: name,
          profilePicture: null
        });
        await user.save();
        console.log(`Created new user: ${username}`);
      } else {
        // Update existing user info (but preserve profile picture)
        user.username = username;
        user.name = name;
        await user.save();
      }

      // Set up session with database data
      req.session.account = {
        username: username,
        email: email,
        name: name,
        profilePicture: user.profilePicture || null,
        idTokenClaims: claims
      };
      
      req.session.save();
    } catch (error) {
      console.error('Error syncing user with database:', error);
      // Fallback to basic session setup
      req.session.account = {
        username: username,
        email: email,
        name: name,
        profilePicture: null,
        idTokenClaims: claims
      };
      req.session.save();
    }
  }
  next();
});

// Routes
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.use("/likes", likesRouter);
app.use("/hashtags", hashtagsRouter);

app.get("/signin", (req, res, next) => {
  return req.authContext.login({ postLoginRedirectUri: "/" })(req, res, next);
});

app.get("/signout", (req, res, next) => {
  return req.authContext.logout({ postLogoutRedirectUri: "/" })(req, res, next);
});

app.use(authProvider.interactionErrorHandler());

export default app;