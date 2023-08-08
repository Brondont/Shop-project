const fs = require("fs");
const path = require("path");

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const { Session } = require("inspector");
const csrf = require("csurf");
const multer = require("multer");
const helmet = require("helmet");

const adminRoutes = require("./routers/admins");
const authRoutes = require("./routers/auth");
const userRoutes = require("./routers/user");
const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.5znihve.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();

const store = new MongoDBStore({
  uri: MONGODB_URI,
  session: "sessions",
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join("images"));
  },
  filename: (req, file, cb) => {
    cb(null, Math.random() + "_" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const fileTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (fileTypes.includes(file.mimetype)) cb(null, true);
  else cb(null, false);
};

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(helmet());

app.use(cookieParser("secret"));
app.use(express.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
  session({
    secret: "Secret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { maxAge: 1200000 },
  })
);

app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session?.isLoggedIn || false;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) return next();
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});

app.use(authRoutes.router);
app.use(adminRoutes.router);
app.use(userRoutes.router);

app.use("/500", errorController.get500Page);
app.use(errorController.get404Page);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session?.isLoggedIn || false,
  });
});
app.use("/500", errorController.get500Page);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 3000);
    console.log("Server started!");
  })
  .catch((err) => console.log(err));

module.exports = app;
