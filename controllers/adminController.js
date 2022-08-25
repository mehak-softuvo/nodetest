var Admin = require('../models/adminModel.js');
var User = require('../models/userModel.js');
var Vendor = require('../models/vendorModel.js');
var Product = require('../models/productModel.js');
var Static = require('../models/staticModel.js');
var Query = require('../models/queryModel.js');
var Click = require('../models/clickModel.js');
var Revenue = require('../models/revenueModel.js');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
var { encode, decode } = require('../helpers/hash');
var jwt = require('jsonwebtoken');
var config = require('config');
var mailer = require('../helpers/mailer');
var moment = require('moment');
const twilio = config.get('twilio');
const accountSid = twilio.TWILIO_ACCOUNT_SID;
const authToken = twilio.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
var CronJob = require('cron').CronJob;
const perClickPrice = 0.41;
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;
const stripeSecretKey = config.get('stripe').SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
/**
 * adminController.js
 *
 * @description :: Server-side logic for managing admin.
 */
module.exports = {

    /**
     * adminController.login()
     */
    login: async function (req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            let checkAdmin = await Admin.findOne({
                email: req.body.email
            });
            if (!checkAdmin) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid credentails',
                });
            } else {
                const match = await bcrypt.compare(req.body.password, checkAdmin.password);
                if (!match) {
                    return res.status(400).json({
                        status: false,
                        message: 'Invalid credentails',
                    });
                } else {
                    let adminJson = checkAdmin.toJSON();
                    adminJson.role = 'admin';
                    adminJson.token = jwt.sign(adminJson, config.get('site.secret'), { expiresIn: '2d' });
                    delete adminJson.password;
                    return res.status(200).json({
                        data: adminJson,
                        status: true,
                        message: 'Login successfully',
                    });
                }
            }

        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
    },

    /**
     * adminController.getProfile()
     */
    getProfile: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            // Check admin existence
            let checkAdmin = await Admin.findOne({
                _id: req.user._id
            });
            if (checkAdmin) {
                return res.status(200).json({
                    status: true,
                    data: checkAdmin,
                    message: "Profile details",
                });
            } else {
                return res.status(401).json({
                    status: false,
                    message: 'You are logged out.'
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
    },

    /**
     * adminController.update()
     */
    update: async function (req, res) {
        const errors = validationResult(req);
        if (req.file) {
            req.body['image'] = '/uploads/' + req.file.filename;
        }
        const entries = Object.keys(req.body)
        const updates = {}
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let admin;
        const { _id } = req.user;
        try {
            if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
            // constructing dynamic query
            for (let i = 0; i < entries.length; i++) {
                updates[entries[i]] = Object.values(req.body)[i]
            }
            // update profile
            admin = await Admin.updateOne({ _id }, { $set: updates })
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            data: admin,
            status: true,
            message: 'Profile updated successfully',
        });
    },

    /**
     * adminController.dashboardCount()
     */
    dashboardCount: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            let earnings = 0;

            // Users count
            const users = await User.countDocuments();

            // Vendors count
            const vendors = await Vendor.find({ isApproved: 'approved' }).countDocuments();

            // Products count
            const products = await Product.countDocuments();

            // Total clicks count
            const clicks = await Click.countDocuments();



            const earningResult = await Revenue.aggregate([
                {
                    "$group": {
                        "_id": null,
                        "total": {
                            "$sum": {
                                "$toDouble": "$cost"
                            }
                        },
                        "count": {
                            "$sum": 1
                        }
                    }
                }
            ])

            if (earningResult && earningResult[0] && earningResult[0].total) earnings = earningResult[0].total

            return res.status(200).json({
                data: { users, vendors, products, clicks, earnings },
                status: true,
                message: 'Dashboard details',
            });
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
    },

    /**
     * adminController.createVendor()
     */
    createVendor: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        var vendorJson, vendor;
        if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
        const { firstName, lastName, phone, email, password, streetAddress1, streetAddress2, city, region, country, postalCode, website } = req.body;
        try {

            // Check vendor existence
            let checkVendor = await Vendor.findOne({
                email: req.body.email
            });
            if (checkVendor) {
                return res.status(400).json({
                    status: false,
                    message: "Email already exist",
                });
            } else {
                // Create new user
                vendor = await Vendor.create({
                    firstName,
                    lastName,
                    phone,
                    email,
                    password,
                    streetAddress1,
                    streetAddress2,
                    city,
                    region,
                    country,
                    postalCode,
                    website,
                    isEmailVerified: true
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
            data: vendor,
            status: true,
            message: 'Created successfully',
        });
    },

    /**
     * adminController.updateVendor()
     */
    updateVendor: async function (req, res) {
        const errors = validationResult(req);
        if (req.file) {
            req.body['shopImage'] = '/uploads/' + req.file.filename;
        }
        const entries = Object.keys(req.body)
        const updates = {}
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let vendor;
        const { vendorId } = req.params;
        try {
            if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
            // constructing dynamic query
            for (let i = 0; i < entries.length; i++) {
                updates[entries[i]] = Object.values(req.body)[i]
            }
            // update profile
            vendor = await Vendor.updateOne({ _id: vendorId }, { $set: updates });


            if (req.body.isApproved == 'approved') {
                let vData = await Vendor.findOne({ _id: vendorId })
                vData.token = encode(vData._id);
                await vData.save();
                mailData = {
                    to: vData.email,
                    subject: "Status of Business Request | Clikiko",
                    template: 'approval',
                    data: {
                        name: (vData.firstName) + ' ' + (vData.lastName),
                        businessName: vData.shopName,
                        url: 'https://business.clikiko.com' + '/vendor/verify-account/' + vData.token
                    }
                }
                mailer.sendMail(mailData);
              let setTime = '* */24 * * *';
               //let   setTime = '* * * * *';
                var job = new CronJob(setTime, async () => {
                    let vendordata =  await Vendor.findOneAndUpdate({ _id: vendorId },{ token : '' }, { new: true })
                    console.log("vendordata",vendordata)
                    if(vendordata){
                        job.stop()
                    }
                }, null, true, '');
                job.start();
 
            }
            if (req.body.isApproved == 'rejected') {

                let vData = await Vendor.findOne({ _id: vendorId });
                console.log("dghggg", vData);
                mailData = {
                    to: vData.email,
                    subject: "Status of Business Request | Clikiko",
                    template: 'reject',
                    data: {
                        name: (vData.firstName) + ' ' + (vData.lastName),
                        businessName: vData.shopName
                    }
                }
                mailer.sendMail(mailData);
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
            data: vendor,
            status: true,
            message: 'Updated successfully',
        });
    },

    /**
     * adminController.getVendor()
     */
    getVendor: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            const { vendorId } = req.params;
            // Check vendor existence
            let checkVendor = await Vendor.findOne({
                _id: vendorId
            });
            if (checkVendor) {
                return res.status(200).json({
                    status: true,
                    data: checkVendor,
                    message: "Profile details",
                });
            } else {
                return res.status(401).json({
                    status: false,
                    message: 'You are logged out.'
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
    },

    /**
     * adminController.listVendors()
     */
    listVendors: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { page, limit, query, type } = req.query;
        let vendors = [], vendorCount = 0, keyword = '', isApproved = '';
        try {
            if (query) keyword = query;
            if (type) isApproved = type;
            if(type=="unapproved") isApproved = { $ne: "approved" }
            const result = await Vendor.aggregate([
                {
                    $project: {
                        name: { $concat: ["$firstName", " ", "$lastName"] },
                        userName: 1,
                        firstName: 1,
                        lastName: 1,
                        shopName: 1,
                        shopImage: 1,
                        email: 1,
                        phone: 1,
                        streetAddress1: 1,
                        streetAddress2: 1,
                        city: 1,
                        region: 1,
                        country: 1,
                        postalCode: 1,
                        website: 1,
                        status: 1,
                        createdAt: 1,
                        isApproved: 1
                    }
                },
                {
                    $match: {
                        shopName: { $regex: keyword, $options: 'i' },
                        isApproved: isApproved
                    }
                },
                {
                    $facet: {
                        docs: [
                            { $sort: { createdAt: -1 } },
                            { $limit: ((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit) },
                            { $skip: (parseInt(page) - 1) * parseInt(limit) },
                        ],
                        count: [{ $count: "count" }]
                    }
                },

            ]);


            if (result && result[0] && result[0].docs && result[0].docs[0]) {
                vendors = result[0].docs
                vendorCount = result[0].count[0].count
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
            data: { vendors, vendorCount },
            message: 'Vendors'
        });
    },

    /**
     * adminController.listShopWiseRevenue()
     */
    listShopWiseRevenue: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { page, limit, query } = req.query;
        let vendors = [], vendorCount = 0, keyword = '';
        try {
            if (query) keyword = query
            const result = await Vendor.aggregate([
                { $match: { shopName: { $regex: keyword, $options: 'i' } } },
                {
                    $project: {
                        shopName: 1,
                        shopImage: 1,
                        isApproved: 1
                    }
                },
                {
                    $facet: {
                        docs: [
                            { $sort: { createdAt: -1 } },
                            { $limit: ((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit) },
                            { $skip: (parseInt(page) - 1) * parseInt(limit) },
                        ],
                        count: [{ $count: "count" }]
                    }
                }
            ]);

            if (result && result[0] && result[0].docs && result[0].docs[0]) {
                vendors = result[0].docs
                for (const vendor of vendors) {
                    vendor.clicks = await Click.count({ vendorId: vendor._id })
                    let revenue = await Revenue.aggregate([
                        { $match: { vendorId: vendor._id } },
                        {
                            "$group": {
                                "_id": null,
                                "total": {
                                    "$sum": {
                                        "$toDouble": "$cost"
                                    }
                                },
                                "count": {
                                    "$sum": 1
                                }
                            }
                        }
                    ]);
                    if (revenue.length > 0) {
                        vendor.cost = revenue[0].total;
                    } else {
                        vendor.cost = 0;
                    }

                }
                vendorCount = result[0].count[0].count
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
            data: { vendors, vendorCount },
            message: 'Vendors'
        });
    },

    /**
     * adminController.listAllShops()
     */
    listAllShops: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let vendors;
        try {
            vendors = await Vendor.aggregate([
                { $match: { $and: [{ shopName: { $ne: '' } }, { shopName: { $ne: undefined } }] } },
                {
                    $project: {
                        shopName: 1
                    }
                }
            ]).sort({ createdAt: -1 });
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
            data: vendors,
            message: 'Vendors'
        });
    },

    /**
     * adminController.deleteVendor()
     */
    deleteVendor: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { vendorId } = req.params;
        try {
            // Delete product
            await Vendor.findOneAndRemove({ _id: vendorId });

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
            message: 'Deleted successfully',
        });
    },

    /**
     * adminController.createUser()
     */
    createUser: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let user;
        if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
        // const { firstName, lastName, phone, email, password } = req.body;
        try {

            // Check user existence
            if (req.body.phone) {
                user = await User.create({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    username: req.body.username,
                    dob: req.body.dob,
                    phone: req.body.phone,
                    password: req.body.password
                });
            } else if (req.body.email) {
                // Check user existence
                let checkUser = await User.findOne({
                    email: req.body.email
                });
                if (checkUser) {
                    return res.status(200).json({
                        status: false,
                        message: "Email already exist",
                    });
                }
                user = await User.create({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    username: req.body.username,
                    dob: req.body.dob,
                    email: req.body.email,
                    password: req.body.password
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: 'Either phone or email is required for registration',
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
            data: user,
            status: true,
            message: 'Created successfully',
        });
    },

    /**
     * adminController.updateUser()
     */
    updateUser: async function (req, res) {
        const errors = validationResult(req);
        if (req.file) {
            req.body['image'] = '/uploads/' + req.file.filename;
        }
        const entries = Object.keys(req.body)
        const updates = {}
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let vendor;
        const { userId } = req.params;
        try {
            if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
            // constructing dynamic query
            for (let i = 0; i < entries.length; i++) {
                updates[entries[i]] = Object.values(req.body)[i]
            }
            // update profile
            vendor = await User.updateOne({ _id: userId }, { $set: updates })

        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            data: vendor,
            status: true,
            message: 'Updated successfully',
        });
    },

    /**
     * adminController.getUser()
     */
    getUser: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            const { userId } = req.params;
            // Check vendor existence
            let checkVendor = await User.findOne({
                _id: userId
            });
            if (checkVendor) {
                return res.status(200).json({
                    status: true,
                    data: checkVendor,
                    message: "Profile details",
                });
            } else {
                return res.status(401).json({
                    status: false,
                    message: 'You are logged out.'
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
    },

    /**
     * adminController.listUsers()
     */
    listUsers: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { page, limit, query } = req.query;
        let users = [], userCount = 0, keyword = '';
        try {
            if (query) keyword = query
            const result = await User.aggregate([
                {
                    $project: {
                        name: { $concat: ["$firstName", " ", "$lastName"] },
                        firstName: 1,
                        lastName: 1,
                        username: 1,
                        email: 1,
                        phone: 1,
                        dob: 1,
                        status: 1,
                        createdAt: 1
                    }
                },
                { $match: { name: { $regex: keyword, $options: 'i' } } },
                {
                    $facet: {
                        docs: [
                            { $sort: { createdAt: -1 } },
                            { $limit: ((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit) },
                            { $skip: (parseInt(page) - 1) * parseInt(limit) },
                        ],
                        count: [{ $count: "count" }]
                    }
                }
            ]);

            if (result && result[0] && result[0].docs && result[0].docs[0]) {
                users = result[0].docs
                userCount = result[0].count[0].count
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
            data: { users, userCount },
            message: 'Users'
        });
    },

    /**
     * adminController.deleteUser()
     */
    deleteUser: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { userId } = req.params;
        try {
            // Delete product
            await User.findOneAndRemove({ _id: userId });

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
            message: 'Deleted successfully',
        });
    },

    /**
    * adminController.createReportOptions()
    */
    createReportOptions: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let reportOptions;
        const { reports } = req.body;
        try {
            // Create report options
            // await Static.deleteMany({ slug: 'report' });
            reportOptions = await Static.insertMany(reports);

        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            data: reportOptions,
            status: true,
            message: 'Report options added successfully',
        });
    },

    /**
     * adminController.listQueries()
     */
    listQueries: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { page, limit, query } = req.query;
        let queries = [], queryCount = 0,
            keyword = '';
        try {
            if (query) keyword = query
            const result = await Query.aggregate([
                { $match: { name: { $regex: keyword, $options: 'i' } } },
                {
                    $facet: {
                        docs: [
                            { $sort: { createdAt: -1 } },
                            { $limit: ((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit) },
                            { $skip: (parseInt(page) - 1) * parseInt(limit) },
                        ],
                        count: [{ $count: "count" }]
                    }
                }
            ]);

            if (result && result[0] && result[0].docs && result[0].docs[0]) {
                queries = result[0].docs
                queryCount = result[0].count[0].count
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
            data: { queries, queryCount },
            message: 'User queries'
        });
    },

    /**
     * adminController.lineGraph()
     */
    lineGraph: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            if (!req.query.week && !req.query.month && !req.query.year && !req.query.range) {
                return res.status(400).json({
                    status: false,
                    message: 'Please select view type',
                });
            }

            const startDate = new Date(req.body.startDate)
            const endDate = new Date(req.body.endDate)
            let totalClicks = 0;
            let graphData = [];
            let finalResult;
            let counter = 0;
            let matchQuery

            if (req.body.vendorId) {
                matchQuery = {
                    $match: {
                        updatedAt: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        },
                        vendorId: ObjectID(req.body.vendorId)
                    },
                }
            } else {
                matchQuery = {
                    $match: {
                        updatedAt: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        },
                    },
                }
            }

            let salesQuery = [
                matchQuery,
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$updatedAt',
                            },
                        },
                        count: { $sum: 1 }
                    },
                },
                { $sort: { _id: 1 } },
            ];


            //Monthly view
            if (req.query.month) {
                values = getDateRange(
                    startDate,
                    new Date(
                        startDate.getFullYear(),
                        startDate.getMonth() + 1,
                        0
                    ).getDate()
                );
            }

            //Weekly view
            if (req.query.week) {
                values = getDateRange(startDate, 7);
            }

            //Yearly view
            if (req.query.year) {
                let salesResult = await Click.aggregate(salesQuery);

                let count = 0;
                let prev;
                let months = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ];
                if (salesResult.length > 0) {
                    months.forEach((allMonth) => {
                        salesResult.forEach((element) => {
                            let month = new Date(element._id).getMonth();

                            if (allMonth == months[month]) {
                                if (
                                    prev == month ||
                                    typeof prev == 'undefined'
                                ) {
                                    for (let i = 0; i < 12; i++) {
                                        if (
                                            typeof prev == undefined ||
                                            month == i
                                        ) {
                                            totalClicks =
                                                totalClicks +
                                                element.count;
                                            prev = month;
                                        }
                                    }
                                    count++;
                                } else if (prev < month) {
                                    let data = {
                                        valueKey: months[month - 1],
                                        clicks: totalClicks,
                                    };
                                    graphData.push(data);
                                    totalClicks = 0;
                                    for (let i = 0; i < 12; i++) {
                                        if (
                                            typeof prev == 'undefined' ||
                                            month == i
                                        ) {
                                            totalClicks =
                                                totalClicks +
                                                element.count;
                                            prev = month;
                                        }
                                    }
                                    count++;
                                }
                                if (count == salesResult.length) {
                                    let data = {
                                        valueKey: allMonth,
                                        clicks: totalClicks,
                                    };
                                    graphData.push(data);
                                }
                                counter = 0;
                            } else {
                                counter++;
                                if (counter == salesResult.length) {
                                    let data = {
                                        valueKey: allMonth,
                                        clicks: 0,
                                    };
                                    graphData.push(data);
                                    counter = 0;
                                }
                            }
                        });
                        counter = 0;
                    });
                } else {
                    for (let i = 0; i < months.length; i++) {
                        let data = {
                            valueKey: months[i],
                            clicks: 0,
                        };
                        graphData.push(data);
                    }
                }
            }

            if (req.query.range) {
                values = getDateRange(startDate, (moment(endDate).diff(startDate, 'days')) + 2);
            }
            //Logic for month and week
            if (req.query.week || req.query.month || req.query.range) {
                let salesResult = await Click.aggregate(salesQuery);

                if (salesResult.length > 0) {
                    values.forEach((date) => {
                        let data;
                        salesResult.forEach((element) => {
                            if (date == element._id) {
                                totalClicks = totalClicks + element.count
                                data = {
                                    valueKey: element._id,
                                    clicks: element.count,
                                };
                                graphData.push(data);
                                counter = 0;
                            } else {
                                counter++;
                                if (counter == salesResult.length) {
                                    data = {
                                        valueKey: date,
                                        clicks: 0,
                                    };
                                    graphData.push(data);
                                    counter = 0;
                                }
                            }
                        });
                        counter = 0;
                    });
                } else {
                    for (let i = 0; i < values.length; i++) {
                        let data = {
                            valueKey: values[i],
                            clicks: 0,
                        };
                        graphData.push(data);
                    }
                }
            }

            finalResult = {
                clickRecords: graphData,
                totalClicks
            };
            graphData = [];

            return res.status(200).json({
                status: true,
                data: finalResult,
                message: 'Graph data'
            });
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
    },

    /**
    * adminController.forgotPassword()
    */
    forgotPassword: async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let checkAdmin, mailData;
        try {
            checkAdmin = await Admin.findOne({
                email: req.body.email
            });
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        if (checkAdmin) {
            try {
                checkAdmin.token = generateRandomString(12);
                await checkAdmin.save();
                mailData = {
                    to: checkAdmin.email,
                    subject: "Reset Password | Clikiko",
                    template: 'reset_password',
                    data: {
                        name: 'Admin',
                        url: 'https://admin.clikiko.com' + '/admin/reset-password/' + checkAdmin.token
                    }
                }
                mailer.sendMail(mailData);
                return res.status(200).json({
                    status: true,
                    data: checkAdmin.token,
                    message: 'A reset password link sent to your mail',
                });
            } catch (err) {
                console.log(err)
                return res.status(500).json({
                    error: err,
                    status: false,
                    message: 'Something went wrong',
                });
            }
        } else {
            return res.status(500).json({
                status: false,
                message: 'Invalid user'
            });
        }
    },

    /**
     * adminController.resetPassword()
     */
    resetPassword: async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            let checkAdmin = await Admin.findOne({
                token: req.body.token
            });
            if (checkAdmin) {
                // if(!checkAdmin.token) {
                //     return res.status(400).json({
                //         status: false,
                //         message: 'Reset link is expired, generate a new one.'
                //     });
                // }
                checkAdmin.password = await bcrypt.hash(req.body.password, 10);
                checkAdmin.token = '';
                await checkAdmin.save();
            } else {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid User.'
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Something went wrong.'
            });
        }
        return res.status(200).json({
            status: true,
            message: 'Password updated successfully.',
        });
    },
    /**
     * adminController.changePassword()
     */
    changePassword: async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            let checkAdmin = await Admin.findOne({
                _id: req.user._id
            });
            if (checkAdmin) {
                const match = await bcrypt.compare(req.body.oldPassword, checkAdmin.password);
                if (!match) {
                    return res.status(200).json({
                        status: false,
                        message: 'Old password didn\'t match'
                    });
                }
                checkAdmin.password = await bcrypt.hash(req.body.password, 10);
                checkAdmin.token = '';
                await checkAdmin.save();
            } else {
                return res.status(401).json({
                    status: false,
                    message: 'Invalid User.'
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Something went wrong.'
            });
        }
        return res.status(200).json({
            status: true,
            message: 'Password updated successfully.',
        });
    },

    paymentDetail: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            const { page, limit, query, startDate, endDate } = req.query;
            console.log("==========", startDate, endDate)
            // Check vendor existence
            let groupList
            let paymentMethods

            let checkRevenue = await Revenue.find({ createdAt: { $gte: (startDate), $lte: (endDate) } }).populate("vendorId").populate("productId").limit(((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
            if (checkRevenue.length) {
                groupList = checkRevenue && checkRevenue.length > 0 && checkRevenue.map(async item => {
                    paymentMethods = await stripe.paymentMethods.list({
                        customer: item.customerId,
                        type: 'card',
                    });
                    // console.log("itemeeeeeeeeeee", paymentMethods)
                    item['paymentdetail'] = paymentMethods
                    return item
                })
                checkRevenue = await Promise.all(groupList)

                return res.status(200).json({
                    status: true,
                    data: checkRevenue,
                    message: "Card detail",
                });
            } else {
                return res.status(200).json({
                    status: true,
                    message: 'No data found'
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
    },

    resetUserPassword: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            let phone = req.body.phone
            const password = generateRandomString(8);
            console.log("password", password);
            passwordE = await bcrypt.hash(password, 10);
            console.log("password==", password);
            let updateUser = await User.findOneAndUpdate({ phone: phone }, { password: passwordE }, { new: true })
            if (updateUser) {
                await client.messages
                    .create({
                        body: 'Admin has reset your password . Please use this password to login Clikiko. Your current password is  ' + password,
                        from: twilio.TWILIO_PHONE_NUMBER,
                        to: "+91" + phone
                    })
                    .then(message => console.log(message.sid));
                return res.status(200).json({
                    status: true,
                    password: password,
                    message: 'Password Change Sucessfully',
                });
            } else {
                return res.status(200).json({
                    status: false,

                    message: 'Phone Number does not exit',
                });
            }
        } catch (err) {
            console.log(err)
            return res.status(200).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
    },


};

const getDateRange = (date, range) => {
    let start = new Date(date);
    let arr = [];
    let data = new Date(moment(start.setDate(start.getDate())));
    arr.push(data.toISOString().split('T')[0]);
    for (let i = 0; i < range - 1; i++) {
        data = new Date(moment(start.setDate(start.getDate() + 1)));
        arr.push(data.toISOString().split('T')[0]);
    }
    return arr;
};

function generateRandomString(length = 8) {
    let string = '';
    let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < length; i++) {
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
}