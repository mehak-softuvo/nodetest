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
   * productController.create()
   */
  create: async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array(),
        status: false,
        message: errors.array()[0].msg,
      });
    }
    let product;
    // const { name, price, weight, description, websiteUrl, categoryId } = req.body;
    req.body.addedBy = req.user._id;
    let shopData = await Vendor.findOne({ _id: req.user._id });
    console.log("shopData-======", shopData);
    let categorydata = await Category.findOne({ _id: req.body.categoryId })
    try {
      // Create new product
      if (req.file) {
        // let imgurl = req.headers.host + '/' + req.file.path
        req.body["mainImage"] = "/uploads/" + req.file.filename;
      }

      req.body.searchName = shopData.shopName + '  ' + req.body.name + ' ' + req.body.description + ' ' + categorydata.name
      product = await Product.create(req.body);

    } catch (err) {
      console.log(err);
      return res.status(500).json({
        error: err,
        status: false,
        message: "Something went wrong",
      });
    }

    return res.status(200).json({
      data: product,
      status: true,
      message: "Product created successfully",
    });
  },

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
    let productList = [];
    const { page, limit, query } = req.query;
    const { addedBy, categories } = req.body;
    let shopName, shopImage,
      matchQuery = {},
      keyword = '';
    let products = [], to, productCount = 0, inactiveCategories = [];
    try {
      if (query) keyword = query;
     
      const userId = req.user._id;
      console.log("userId", userId, req.user.role);

      if (req.user.role == 'user') {
        inactiveCategories = await Category.find({ status: 0 }, { _id: 1 });
      }

      let objectedInactiveCategories = []
      for (category of inactiveCategories) {
        objectedInactiveCategories.push(ObjectID(category._id));
      }
      var splitSearch = keyword.split(/\s+/);
      console.log("keeeeee",splitSearch)
      var regex1 = splitSearch.join("|");

      if (addedBy) {  // To get Products of particular shop:
        if (req.user.role == 'user') {
          
          // To send only active products, in case of user:
          matchQuery = {
            searchName: { $regex: regex1, $options: 'i' },
            // name: { $regex: keyword, $options: 'i' },
            addedBy: ObjectID(addedBy),
            categoryId: { $nin: objectedInactiveCategories },
            status: 1
          }
        } else {
          matchQuery = {
            searchName: { $regex: regex1, $options: 'i' },
            // name: { $regex: keyword, $options: 'i' },
            addedBy: ObjectID(addedBy)
          }
        }
      } else if (categories && categories.length > 0) {  // To get Products of specific categories:
        let objectedCategories = []
        for (category of categories) {
          objectedCategories.push(ObjectID(category));
        }
        if (req.user.role == 'user') {
          // To update user preferences:
          let checkUser = await User.findOne({
            _id: userId
          });
          if (checkUser) {
            checkUser.isAllCategoriesPreferred = false;
            checkUser.preferredCategories = categories;
            await checkUser.save();
          } else {
            return res.status(200).json({
              status: false,
              message: 'Invalid User.'
            });
          }
          if (keyword) {
            matchQuery = {
              searchName: { $regex: regex1, $options: 'i' },
              status: 1
            }
          } else {
            matchQuery = {
              searchName: { $regex: regex1, $options: 'i' },
              // name: { $regex: keyword, $options: 'i' },
              categoryId: { $in: objectedCategories },
              status: 1
            }
          }


        } else {
          matchQuery = {
            searchName: { $regex: regex1, $options: 'i' },
            // name: { $regex: keyword, $options: 'i' },
            categoryId: { $in: objectedCategories }
          }
        }
      } else {
        if (req.user.role == 'user') {
          if (categories == null) {
            // To update user preferences:
            let objectedCategories = []

            let checkUser = await User.findOne({
              _id: userId
            });
            let categories = checkUser.preferredCategories;
            for (category of categories) {
              objectedCategories.push(ObjectID(category));
            }

            if (keyword) {
              matchQuery = {
                searchName: { $regex: regex1, $options: 'i' },
                status: 1
              }
            } else {
              if (objectedCategories && objectedCategories.length) {

                matchQuery = {
                  categoryId: { $in: objectedCategories },
                  status: 1
                }
              }

            }
          } else if (categories && categories.length == 0) {
            // To update user preferences:
            let checkUser = await User.findOne({
              _id: userId
            });
            if (checkUser) {
              checkUser.isAllCategoriesPreferred = true;
              checkUser.preferredCategories = [];
              await checkUser.save();
            } else {
              return res.status(200).json({
                status: false,
                message: 'Invalid User.'
              });
            }
            if (keyword) {

              matchQuery = {
                searchName: { $regex: regex1, $options: 'i' },
                status: 1
              }
            } else {

              matchQuery = {
                categoryId: { $nin: objectedInactiveCategories },
                status: 1
              }
            }
          }
          // matchQuery = {
          //   searchName: { $regex: keyword, $options: 'i' },
          //   // name: { $regex: keyword, $options: 'i' },
          //   categoryId: { $nin: objectedInactiveCategories },
          //   status: 1
          // }
        } else {
            matchQuery = {
              searchName: { $regex: regex1, $options: 'i' },
            }
        }
      }
      console.log("===========",matchQuery)

      matchQuery.delete_status = false
      const result = await Product.aggregate([
        { $match: matchQuery },
        { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'categoryId' } },
        { $unwind: '$categoryId' },
        { $lookup: { from: 'vendors', localField: 'addedBy', foreignField: '_id', as: 'addedBy' } },
        { $unwind: '$addedBy' },
        {
          $project: {
            description: 1, images: 1, isAd: 1, totalClickCount: 1, freshClickCount: 1, status: 1, name: 1, price: 1, websiteUrl: 1, mainImage: 1, createdAt: 1, updatedAt: 1, adDeductionCost: 1, 'categoryId._id': 1, 'categoryId.name': 1, 'addedBy._id': 1, 'addedBy.shopName': 1, 'addedBy.shopImage': 1
          }
        },
        {
          $facet: {
            docs: [
              { $sort: { isAd: -1,
              createdAt:-1 } },
              { $skip: (parseInt(page) - 1) * parseInt(limit) },
              { $limit: ((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit) },
            ],
            count: [{ $count: "count" }]
          }
        }

      ]);
      // console.log("result",JSON.stringify(result));
      if (result && result[0] && result[0].docs && result[0].docs[0]) {
        products = result[0].docs
        productCount = result[0].count[0].count
      }

      if (products && products.length) {
        to = (parseInt(page) - 1) * parseInt(limit) + products.length;
      } else {
        to = productCount;
      }

      // To check whether Product is in wishlist or not, in case of user:
      if (req.user.role == 'user') {
        productList = products.map(async (item) => {
          let whishlistdata = await Wishlist.findOne({
            productId: ObjectID(item._id),
            userId: ObjectID(userId),
          });
          if (whishlistdata) {
            if (whishlistdata.productId.toString() == item._id.toString()) {
              item["isWhishlisted"] = true;
              return item;
            }
          } else {
            item["isWhishlisted"] = false;
            return item;
          }
        });

        products = await Promise.all(productList);
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
      data: addedBy
        ? { shopName, shopImage, products, to, productCount }
        : { products, to, productCount },
      message: "Products",
    });
  },

  /**
   * productController.update()
   */
  update: async function (req, res) {
    const errors = validationResult(req);
    if (req.file) {
      req.body["mainImage"] = "/uploads/" + req.file.filename;
    }
    const entries = Object.keys(req.body);
    const updates = {};
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array(),
        status: false,
        message: errors.array()[0].msg,
      });
    }
    let product;
    const { productId } = req.params;
    try {
      // constructing dynamic query
      for (let i = 0; i < entries.length; i++) {
        updates[entries[i]] = Object.values(req.body)[i];
      }
      if (req.body.description) {
        let findData = await Product.findOne({ _id: productId })
        updates.searchName = findData.searchName + ' ' + req.body.description
      }
      // update product
      product = await Product.findOneAndUpdate({ _id: productId }, { $set: updates }, { new: true });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        error: err,
        status: false,
        message: "Something went wrong",
      });
    }

    return res.status(200).json({
      data: product,
      status: true,
      message: "Product updated successfully",
    });
  },

  /**
   * productController.delete()
   */
  delete: async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array(),
        status: false,
        message: errors.array()[0].msg,
      });
    }
    let product;
    const { productId } = req.params;
    const userId = req.user._id;
    try {
      // Delete product & Remove from wishlist, if exist
      await Product.findOneAndUpdate({ _id: productId }, { delete_status: true }, { new: true })
      // await Product.findOneAndRemove({ _id: productId });
      await Wishlist.findOneAndDelete({ productId: ObjectID(productId) });
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
      message: "Product deleted successfully",
    });
  },

  /**
   * productController.handleWebsiteVisit()
   */
  handleWebsiteVisit: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array(),
        status: false,
        message: errors.array()[0].msg,
      });
    }

    const { productId } = req.body;
    const userId = req.user._id;
    try {
      const product = await Product.findOne({ _id: productId });
      if (product) {
        // Update click count
        product.totalClickCount += 1;
        product.freshClickCount += 1;
        await product.save();

        // Maintain click
        await Click.create({
          productId,
          vendorId: product.addedBy,
          clickedBy: userId
        })
      } else {
        return res.status(200).json({
          status: false,
          message: "Product not found",
        });
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
      message: "Visit handled",
    });
  },
};
