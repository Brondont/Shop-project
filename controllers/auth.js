const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const nodemailerMailgun = require("nodemailer-mailgun-transport");
const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport(
  nodemailerMailgun({
    auth: {
      api_key: process.env.MAILGUN_APIKEY,
      domain: process.env.MAILGUN_DOMAIN,
    },
  })
);

const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: req.flash("invalid")[0],
    successMessage: req.flash("success")[0],
    oldInput: {},
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email: email },
    });
  }

  User.findOne({ email: email }).then((user) => {
    if (!user) {
      req.flash("invalid", "Invalid E-mail or Password !");
      return res.redirect("/login");
    }
    return bcrypt.compare(password, user.password).then((doMatch) => {
      if (doMatch) {
        req.session.isLoggedIn = true;
        req.session.user = user;
        return req.session.save((err) => {
          console.log(err);
          res.redirect("/");
        });
      }
      req.flash("invalid", "Invalid E-mail or Password !");
      return res.redirect("/login");
    });
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

exports.getSignUp = (req, res, next) => {
  res.render("auth/sign-up", {
    pageTitle: "Sign Up",
    path: "/signUp",
    errorMessage: req.flash("invalid")[0],
    oldInput: {},
  });
};

exports.postSignUp = (req, res, next) => {
  const newUser = {
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cart: { items: [] },
  };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/sign-up", {
      pageTitle: "Sign Up",
      path: "/signUp",
      errorMessage: errors.array()[0].msg,
      oldInput: { email: newUser.email, username: newUser.username },
    });
  }
  return bcrypt
    .hash(newUser.password, 12)
    .then((hashedPassword) => {
      newUser.password = hashedPassword;
      const user = new User(newUser);
      return user.save();
    })
    .then(() => {
      transporter.sendMail({
        from: "shop@node-complete.com",
        to: req.body.email,
        subject: "SignUp Succesful",
        html: "<h1> Congratulations you are now signed up! </h1>",
      });
      return res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.http = 500;
      return next(error);
    });
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "/resetPassowrd",
    pageTitle: "Reset Password",
    errorMessage: req.flash("invalid")[0],
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const Token = buffer.toString("hex");
    User.findOne({ email: req.body.email }).then((user) => {
      if (!user) {
        req.flash("invalid", "invalid E-mail !");
        return res.redirect("/reset");
      }
      user.resetToken = Token;
      user.resetTokenLife = Date.now() + 360000;
      return user
        .save()
        .then(() => {
          transporter.sendMail({
            to: req.body.email,
            from: "shop@node-complete.com",
            subject: "Password Reset",
            html: `
          <p> You have made a request to reset your password </p>
          <p> click <a href="http://localhost:3000/reset/${Token}"> Here </a> to continue </p>
          `,
          });
          req.flash("success", "An email has been sent with details.");
          return res.redirect("/login");
        })
        .catch((err) => {
          const error = new Error(err);
          error.http = 500;
          return next(error);
        });
    });
  });
};

exports.getResetPassword = (req, res, next) => {
  res.render("auth/resetPassword", {
    path: "/resetPassword",
    pageTitle: "Reset Password",
    Token: req.params.Token,
  });
};

exports.postResetPassword = (req, res, next) => {
  const Token = req.body.Token;
  let tmpUser;
  User.findOne({ resetToken: Token, resetTokenLife: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        req.flash("invalid", "An error occured, try again later.");
        throw new Error("User not found");
      }
      tmpUser = user;
      return bcrypt.hash(req.body.newPassword, 12);
    })
    .then((hashedPassword) => {
      tmpUser.password = hashedPassword;
      tmpUser.resetToken = tmpUser.resetTokenLife = undefined;
      return tmpUser.save();
    })
    .then(() => {
      req.flash("success", "Password Reset Successfully ");
      return res.redirect("/login");
    })
    .catch((err) => {
      if (err.message === "User not found") {
        return res.redirect("/login");
      }
      const error = new Error(err);
      error.http = 500;
      return next(error);
    });
};
