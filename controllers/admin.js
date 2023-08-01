const { validationResult } = require("express-validator");

const Product = require("../models/product");
const fileHelper = require("../util/file");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/add-product", {
    pageTitle: "Add product",
    path: "/admin/add-product",
    oldInput: {},
    csrfToken: req.csrfToken(),
  });
};

exports.postAddProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/add-product", {
      path: "/add-product",
      pageTitle: "Add Product",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
      },
    });
  }

  if (!req.file) {
    return res.status(422).render("admin/add-product", {
      path: "/add-product",
      pageTitle: "Add Product",
      errorMessage: "We only support images of type: jpeg/jpg/png.",
      oldInput: {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
      },
    });
  }

  const product = new Product({
    title: req.body.title,
    price: req.body.price,
    imagePath: " https://shop-service-n1op.onrender.com/ " + req.file.path,
    description: req.body.description,
    userId: req.user,
  });
  product
    .save()
    .then(() => {
      console.log("Product created.");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("admin/edit-product", {
        pageTitle: product.title,
        path: "admin/products",
        product: product,
        oldInput: {},
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      path: "/edit-product",
      pageTitle: "Add Product",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        id: req.body.productId,
      },
    });
  }

  if (!req.file) {
    return res.status(422).render("admin/edit-product", {
      path: "/edit-product",
      pageTitle: req.body.title,
      errorMessage: "We only support images of type: jpeg/jpg/png.",
      oldInput: {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        id: req.body.productId,
      },
    });
  }

  Product.findById(req.body.productId)
    .then((product) => {
      if (!product.userId.equals(req.user._id)) {
        throw new Error("Invalid User");
      }
      fileHelper.deleteFile(product.imagePath);
      Object.assign(product, {
        title: req.body.title,
        price: req.body.price,
        imagePath: req.file.path,
        description: req.body.description,
        id: req.body.productId,
      });
      return product.save();
    })
    .then(() => {
      console.log("Product updated!");
      return res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteItem = (req, res, next) => {
  Product.findById(req.body.productId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found."));
      }
      fileHelper.deleteFile(product.imagePath);
      return Product.deleteOne({
        _id: req.body.productId,
        userId: req.user._id,
      });
    })
    .then(() => {
      console.log("Product Deleted!");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/product-list", {
        pageTitle: "Admin Products",
        products: products,
        path: "/admin/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
