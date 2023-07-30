const express = require("express");
const { check } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Invalid E-mail"),
    check("password").isLength({ min: 6 }).withMessage("Invalid Password"),
  ],
  authController.postLogin
);

router.post("/logout", authController.postLogout);

router.get("/signUp", authController.getSignUp);

router.post(
  "/signUp",
  [
    check("username")
      .isLength({ min: 5, max: 12 })
      .withMessage("Username length between 5-12 characters."),
    check("email")
      .isEmail()
      .withMessage("Invalid E-mail")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((User) => {
          if (User) {
            return Promise.reject("E-mail already in use.");
          }
        });
      }),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Minmum password length is 6 characters."),
    check("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
  ],
  authController.postSignUp
);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:Token", authController.getResetPassword);

router.post("/reset/:Token", authController.postResetPassword);

exports.router = router;
