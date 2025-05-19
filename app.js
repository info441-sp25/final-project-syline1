import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import WebAppAuthProvider from 'msal-node-wrapper'

// const authConfig = {
//     auth: {
//    	clientId: "5c5ea248-bb42-4878-b43c-6deb115420d8",
//     	authority: "https://login.microsoftonline.com/f6b6dd5b-f02f-441a-99a0-162ac5060bd2",
//     	clientSecret: "XCI8Q~t0DEVNrwKWZUU5ih_xVVbzZ.zPXMG5scGi",
//     	redirectUri: "/redirect"
//     },
// 	system: {
//     	loggerOptions: {
//         	loggerCallback(loglevel, message, containsPii) {
//             	console.log(message);
//         	},
//         	piiLoggingEnabled: false,
//         	logLevel: 3,
//     	}
// 	}
// };

import usersRouter from './routes/users.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

app.enable('trust proxy')
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// const oneDay = 1000 * 60 * 60 * 24
// app.use(sessions({
//     secret: "this is some secret key I am making up 093u4oih54lkndso8y43hewrdskjf",
//     saveUninitialized: true,
//     cookie: {maxAge: oneDay},
//     resave: false
// }))

// const authProvider = await WebAppAuthProvider.WebAppAuthProvider.initialize(authConfig);
// app.use(authProvider.authenticate());

app.use('/users', usersRouter);

// app.get('/signin', (req, res, next) => {
//     return req.authContext.login({
//         postLoginRedirectUri: "/", // redirect here after login
//     })(req, res, next);

// });

// app.get('/signout', (req, res, next) => {
//     return req.authContext.logout({
//         postLogoutRedirectUri: "/", // redirect here after logout
//     })(req, res, next);

// });

// app.use(authProvider.interactionErrorHandler());



export default app;
