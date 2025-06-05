import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import sessions from "express-session";
import WebAppAuthProvider from "msal-node-wrapper";
import models from "./model.js";

const authConfig = {
  auth: {
    clientId: "3a10cefa-4921-42e0-a946-6dfeb05857d1",
    authority:
      "https://login.microsoftonline.com/f6b6dd5b-f02f-441a-99a0-162ac5060bd2",
    clientSecret: "nhU8Q~97jEDJrilV7AkbSGfX4N.ay4-wLOKXJb8F",
    redirectUri: "/redirect",
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

import usersRouter from "./routes/users.js";
import postsRouter from "./routes/posts.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

app.enable("trust proxy");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static('uploads'));

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));


app.use((req, res, next) => {
  req.models = models;
  next();
});

const oneDay = 1000 * 60 * 60 * 24;
app.use(
  sessions({
    secret:
      "this is some secret key I am making up 093u4oih54lkndso8y43hewrdskjf",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

const authProvider = await WebAppAuthProvider.WebAppAuthProvider.initialize(
  authConfig
);
app.use(authProvider.authenticate());


app.use((req, res, next) => {
  if (req.session && req.session.account && req.session.account.idTokenClaims) {
    const claims = req.session.account.idTokenClaims;

    req.session.account.username = claims.preferred_username || claims.name || null;
    req.session.account.email = claims.email || claims.preferred_username || null;
    req.session.account.name = claims.name || null;
    req.session.account.profilePicture = req.session.account.profilePicture || null;

    req.session.save();
  }
  next();
});

app.use("/users", usersRouter);
app.use("/posts", postsRouter);

app.get("/signin", (req, res, next) => {
  return req.authContext.login({
    postLoginRedirectUri: "/", // redirect here after login
  })(req, res, next);
});

app.get("/signout", (req, res, next) => {
  return req.authContext.logout({
    postLogoutRedirectUri: "/", // redirect here after logout
  })(req, res, next);
});

app.use(authProvider.interactionErrorHandler());

export default app;
