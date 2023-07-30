const express = require("express");
const { check } = require("express-validator");

const router = express.Router();

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

router.get("/admin/add-product", isAuth, adminController.getAddProduct);

router.get("/admin/products", isAuth, adminController.getProducts);

router.post(
  "/admin/add-product",
  isAuth,
  [
    check("title")
      .isLength({ min: 5 })
      .withMessage("Title must be more than 5 characters.")
      .trim(),
    check("price")
      .isFloat({ min: 0.99 })
      .withMessage("Minimum price for a product is 0.99$"),
    check("description")
      .isLength({ min: 5, max: 300 })
      .withMessage(
        "Description is exceeding the limit of 300 characters or is under 5 charcters long"
      )
      .trim(),
  ],
  adminController.postAddProduct
);

router.get(
  "/admin/edit-product/:productId",
  isAuth,
  adminController.getEditProduct
);

router.post(
  "/admin/edit-product",
  isAuth,
  [
    check("title")
      .isLength({ min: 5 })
      .withMessage("Title must be more than 5 characters.")
      .trim(),
    check("price")
      .isFloat({ min: 0.99 })
      .withMessage("Minimum price for a product is 0.99$"),
    check("description")
      .isLength({ min: 5, max: 300 })
      .withMessage(
        "Description is exceeding the limit of 300 characters or is under 5 charcters long"
      )
      .trim(),
  ],
  adminController.postEditProduct
);

router.post("/admin/delete-product", isAuth, adminController.postDeleteItem);

exports.router = router;
