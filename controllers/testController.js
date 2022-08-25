var Product = require("../models/productModel.js");
var Category = require("../models/categoryModel.js");
var Vendor = require("../models/vendorModel.js");
var Wishlist = require("../models/wishlistModel.js");
var Click = require("../models/clickModel.js");
var User = require("../models/userModel.js");
const { validationResult } = require("express-validator");
var jwt = require("jsonwebtoken");
var config = require("config");
const mongo = require("mongodb");
const { add } = require("./queryController.js");
const ObjectID = mongo.ObjectID;
/**
 * productController.js
 *
 * @description :: Server-side logic for managing products.
 */
module.exports = {

  /**
   * productController.list()
   */
  list: async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array(),
        status: false,
        message: errors.array()[0].msg,
      });
    }
    const { page, limit, } = req.query;
    matchQuery = {}, 
    keyword = '';
    let products = [], to, productCount = 0;
    try {
      const result = await Product.aggregate([
          {$match : matchQuery},
          { $lookup: {from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category'} },
          {$unwind: '$category'},
          { $lookup: {from: 'vendors', localField: 'addedBy', foreignField: '_id', as: 'vendor'} },
          {$unwind: '$vendor'},
          {
            $project: {
              images: 1, isAd: 1, totalClickCount: 1, freshClickCount: 1, status: 1, name: 1, price: 1, websiteUrl: 1, mainImage: 1, createdAt: 1, updatedAt: 1, 'category._id': 1, 'category.name': 1, 'vendor._id': 1, 'vendor.shopName': 1, 'vendor.shopImage': 1
            }
          },
          {
              $facet: {
                docs: [
                    { $sort:  {createdAt: -1} },
                    { $limit:  ((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit) },
                    { $skip:  (parseInt(page) - 1) * parseInt(limit) },                                
                ],
                count:  [{ $count: "count" }]
              }
          }   
      ]);
      // console.log("result",JSON.stringify(result));
      if(result && result[0] && result[0].docs && result[0].docs[0]) {
        products = result[0].docs
        productCount = result[0].count[0].count
      }

      if (products && products.length) {
        to = (parseInt(page) - 1) * parseInt(limit) + products.length;
      } else {
        to = productCount;
      }

    } catch (err) {
      console.log(err);
      return res.status(500).json({
        error: err,
        status: false,
        message: "Something went wrong",
      });
    }
    return res.status(200).json({
      status: true,
      data: { products, to, productCount },
      message: "Products",
    });
  },
};
