const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    require: true,
  },
  resetToken: {
    type: String,
    require: false,
  },
  resetTokenLife: {
    type: Number,
    require: false,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

userSchema.methods.deleteById = function (prodId) {
  const newItems = this.cart.items.filter((item) => {
    return !item.productId.equals(prodId);
  });
  this.cart.items = newItems;
  return this.save();
};

userSchema.methods.addToCart = function (product) {
  let newProduct = true;
  let newItems = this.cart.items.map((item) => {
    if (item.productId.equals(product._id)) {
      newProduct = false;
      item.quantity += 1;
    }
    return item;
  });
  if (newProduct) {
    newItems = [...newItems, { productId: product._id, quantity: 1 }];
  }
  this.cart.items = newItems;
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
// const getDb = require("../util/database").getDb;

// class User {
//   constructor(User) {
//     Object.assign(this, User);
//   }

//   save() {
//     const db = getDb();
//     return db.collection("users").insertOne(this);
//   }

//   addToCart(product) {
//     const db = getDb();
//     let newProduct = true;
//     let newCart = this.cart.items.map((item) => {
//       if (item.productId.equals(product._id)) {
//         newProduct = false;
//         item.quantity += 1;
//       }
//       return item;
//     });
//     if (newProduct) {
//       newCart = [...newCart, { productId: product._id, quantity: 1 }];
//     }
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new mongodb.ObjectId(this._id) },
//         { $set: { cart: { items: newCart } } }
//       );
//   }

//   getCart() {
//     const db = getDb();
//     return db
//       .collection("products")
//       .find({
//         _id: {
//           $in: this.cart.items.map((item) => {
//             return item.productId;
//           }),
//         },
//       })
//       .toArray()
//       .then((products) => {
//         return products.map((product) => {
//           return {
//             ...product,
//             quantity: this.cart.items.find((item) => {
//               return item.productId.equals(product._id);
//             }).quantity,
//           };
//         });
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   deleteByPk(prodId) {
//     const db = getDb();
//     const newCartItems = this.cart.items.filter((item) => {
//       return !item.productId.equals(prodId);
//     });
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new mongodb.ObjectId(this._id) },
//         { $set: { cart: { items: newCartItems } } }
//       );
//   }

//   addOrder() {
//     const db = getDb();
//     return this.getCart()
//       .then((cartProducts) => {
//         const order = {
//           items: cartProducts,
//           user: {
//             _id: new mongodb.ObjectId(this._id),
//             name: this.name,
//           },
//         };
//         return db.collection("orders").insertOne(order);
//       })
//       .then(() => {
//         this.cart = { items: [] };
//         return db
//           .collection("users")
//           .updateOne(
//             { _id: new mongodb.ObjectId(this._id) },
//             { $set: { cart: { items: [] } } }
//           );
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   getOrders() {
//     const db = getDb();

//     return db
//       .collection("orders")
//       .find({ "user._id": this._id })
//       .toArray()
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   static findByPk(userId) {
//     const db = getDb();
//     return db
//       .collection("users")
//       .findOne({ _id: new mongodb.ObjectId(userId) });
//   }
// }

// module.exports = User;
