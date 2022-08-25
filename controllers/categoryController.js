var Category = require('../models/categoryModel.js');
var Product = require('../models/productModel.js');
var User = require('../models/userModel.js');
const { validationResult, query } = require('express-validator');
var jwt = require('jsonwebtoken');
var config = require('config');
var mailer = require('../helpers/mailer');

/**
 * categoryController.js
 *
 * @description :: Server-side logic for managing categories.
 */
module.exports = {

    /**
     * categoryController.create()
     */
    create: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let category;
        const { name } = req.body;
        try {

            // Check category existence
            let checkCategory = await Category.findOne({
                name: name
            });
            if (checkCategory) {
                return res.status(400).json({
                    status: false,
                    message: "Category already exist",
                });
            } else {

                // Create new category
                category = await Category.create({
                    name: name
                });
            }

        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            data: category,
            status: true,
            message: 'Category created successfully',
        });
    },

    /**
     * categoryController.list()
     */
    list: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { page, limit, query } = req.query;
        let categories = [], categoryCount = 0, userData, isAllCategoriesPreferred = false, 
            matchQuery = {}, 
            keyword = '';
        try {
            if(query) keyword = query

            if(req.user.role == 'user') {
                // To display only active categories, in case of user:
                matchQuery = { name: { $regex: keyword, $options:'i'}, status: 1}
            } else {
                matchQuery = { name: { $regex: keyword, $options:'i'}}
            }
            const result = await Category.aggregate([
                {$match : matchQuery},
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

            if(result && result[0] && result[0].docs && result[0].docs[0]) {
                categories = result[0].docs

                // To check whether category lies in user preferences:
                if(req.user.role == 'user') {
                    userData = await User.findOne({_id: req.user._id});
                    if(!userData) {
                        return res.status(200).json({
                            status: false,
                            message: 'Invalid User.'
                        });
                    }
    
                    isAllCategoriesPreferred = userData.isAllCategoriesPreferred
    
                    const categoryList = categories.map(async (category) => {
                        // category = category.toJSON();
                        if (isAllCategoriesPreferred) {
                            category["isPreferred"] = true;
                        } else if (userData.preferredCategories && (userData.preferredCategories).includes(category._id)) {
                            category["isPreferred"] = true;
                        } else {
                            category["isPreferred"] = false;
                        }
                        return category;
                    });
                
                    categories = await Promise.all(categoryList);
                }

                categoryCount = result[0].count[0].count
            }
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
        return res.status(200).json({
            status: true,
            data: userData ? { isAllCategoriesPreferred, categories, categoryCount } : { categories, categoryCount },
            message: 'Categories'
        });
    },

    /**
     * categoryController.listAll()
     */
    listAll: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { page, limit } = req.query;
        let categories;
        try {
            categories = await Category.find({}, {name: 1});
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
        return res.status(200).json({
            status: true,
            data: categories,
            message: 'Categories'
        });
    },

    /**
     * categoryController.listPreferredCategories()
     */
    listPreferredCategories: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let categories;
        try {
            categories = await Category.find({}, {name: 1});
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
        return res.status(200).json({
            status: true,
            data: categories,
            message: 'User not found'
        });
    },

     /**
     * categoryController.update()
     */
    update: async function (req, res) {
        const errors = validationResult(req);
        const entries = Object.keys(req.body)
        const updates = {}
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let category;
        const { categoryId } = req.params;
        try {
            // constructing dynamic query
            for (let i = 0; i < entries.length; i++) {
                updates[entries[i]] = Object.values(req.body)[i]
            }
            // update category
            category = await Category.updateOne({_id: categoryId} , { $set: updates })
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            data: category,
            status: true,
            message: 'Category updated successfully',
        });
    },

    /**
     * categoryController.delete()
     */
    delete: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let category;
        const { categoryId } = req.params;
        try {
            // Delete category
            await Category.findOneAndRemove({_id: categoryId});
            await Product.deleteMany({categoryId});

        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Category deleted successfully',
        });
    },

};
