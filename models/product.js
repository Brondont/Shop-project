const mongoose = require("mongoose");
const { STRING, INTEGER } = require("sequelize");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Product", productSchema);

// class Product {
//   constructor(productObject) {
//     this.product = productObject;
//   }
//   save() {
//     const db = getDb();
//     if (this.product.id) {
//       return db
//         .collection("products")
//         .updateOne(
//           { _id: new mongodb.ObjectId(this.product.id) },
//           { $set: this.product }
//         );
//     }
//     return db.collection("products").insertOne(this.product);
//   }

//   static fetchAll() {
//     const db = getDb();
//     return db.collection("products").find().toArray();
//   }

//   static findByPk(prodId) {
//     const db = getDb();
//     return db
//       .collection("products")
//       .findOne({ _id: new mongodb.ObjectId(prodId) });
//   }

//   static deleteByPk(proid) {
//     const db = getDb();
//     return db
//       .collection("products")
//       .deleteOne({ _id: new mongodb.ObjectId(proid) });
//   }
// }

// module.exports = Product;
