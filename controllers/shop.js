const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/orders");

const ITEMS_PER_PAGE = 3;

exports.getShopIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts;
  Product.find()
    .countDocuments()
    .then((productsCount) => {
      totalProducts = productsCount;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        pageTitle: "Shop",
        products: products,
        path: "/",
        currentPage: page,
        totalPages: Math.ceil(totalProducts / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getShopProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts;
  Product.find()
    .countDocuments()
    .then((productsCount) => {
      totalProducts = productsCount;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        pageTitle: "Products",
        products: products,
        path: "/products",
        errorMessage: req.flash("invalid")[0],
        currentPage: page,
        totalPages: Math.ceil(totalProducts / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getShopProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .populate("userId")
    .then((product) => {
      res.render("shop/product-detail", {
        pageTitle: product.title + "'s Details",
        path: "/products",
        errorMessage: req.flash("invalid")[0],
        product: product,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getShopCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: user.cart.items,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postShopCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() === req.user._id.toString()) {
        return req.flash("invalid", "You can't order your own product!");
      }
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect("/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteById(prodId)
    .then(() => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getShopOrders = (req, res, next) => {
  Order.find({ userId: req.user._id })
    .populate("items.productId")
    .then((orders) => {
      res.render("shop/orders", {
        orders: orders,
        pageTitle: "Orders",
        path: "/orders",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postShopOrders = (req, res, next) => {
  const order = new Order({
    userId: req.user._id,
    items: req.user.cart.items.map((item) => {
      return { productId: item.productId, quantity: item.quantity };
    }),
  });
  order
    .save()
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        throw new Error("Order not found");
      }
      if (!order.userId.equals(req.user._id)) {
        throw new Error("User not valid.");
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline: filename=${invoiceName}`);

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(24).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("---------------------");
      return order.populate("items.productId").then((order) => {
        let totalPrice = 0;
        order.items.map((item) => {
          totalPrice += item.productId.price;
          pdfDoc.text(
            item.productId.title +
              ": " +
              item.quantity +
              " x " +
              item.productId.price +
              "$"
          );
        });
        pdfDoc.text("---------------------");
        pdfDoc.text("Total: " + totalPrice + "$");
        return pdfDoc.end();
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
