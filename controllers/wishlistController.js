var Wishlist = require('../models/wishlistModel.js');
const { validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
var config = require('config');
var mailer = require('../helpers/mailer');

/**
 * wishlistController.js
 *
 * @description :: Server-side logic for managing wishlist.
 */
module.exports = {

    /**
     * wishlistController.add()
     */
    add: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let wishlist;
        req.body.userId = req.user._id;
        try {
            // Check if already wishlisted
            const checkExistence = await Wishlist.findOne({
                productId: req.body.productId,
                userId: req.user._id
            });
            if (checkExistence) {
                return res.status(200).json({
                    status: false,
                    message: "Already wishlisted",
                });
            }
            wishlist = await Wishlist.create(req.body);

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
            wishlisted: true,
            message: 'Added to wishlist',
        });
    },

    /**
     * wishlistController.list()
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
        const { page, limit } = req.query;
        const userId = req.user._id
        let wishlist, to, wishlistCount;
        try {
            wishlist = await Wishlist.find({userId}).populate({ 
                path: 'productId',
                populate: {
                  path: 'addedBy',
                  select: {
                    'shopName': 1,
                    'shopImage': 1,
                  } 
                } 
             }).sort({createdAt: -1}).skip( (parseInt(page) - 1) * parseInt(limit)).limit( parseInt(limit) );
            wishlistCount = await Wishlist.countDocuments({userId});

            if(wishlist && wishlist.length) {
                to = ((parseInt(page) - 1) * parseInt(limit)) + (wishlist.length);
            } else {
                to = wishlistCount;
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
            data: { wishlist, to, wishlistCount },
            message: 'Wishlist'
        });
    },

    /**
     * wishlistController.remove()
     */
    remove: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { wishlistId } = req.body;
        const userId = req.user._id;
        try {
            // Remove from wishlist
            await Wishlist.findOneAndRemove({productId: wishlistId, userId });

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
            wishlisted: false,
            message: 'Removed from wishlist',
        });
    },
}