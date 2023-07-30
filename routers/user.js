const express = require("express");

const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", shopController.getShopIndex);

router.get("/products", shopController.getShopProducts);

router.get("/product/:productId", shopController.getShopProduct);

router.get("/cart", isAuth, shopController.getShopCart);

router.post("/cart", isAuth, shopController.postShopCart);

router.post("/delete-cart-product", isAuth, shopController.postCartDeleteItem);

router.get("/orders", isAuth, shopController.getShopOrders);

router.post("/create-order", isAuth, shopController.postShopOrders);

router.get("/orders/:orderId", isAuth, shopController.getInvoice);

exports.router = router;
