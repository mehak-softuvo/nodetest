var Vendor = require('../models/vendorModel.js');
var Revenue = require('../models/revenueModel');
var Product = require('../models/productModel.js');
var Click = require('../models/clickModel.js');
const { validationResult, check } = require('express-validator');
const bcrypt = require('bcrypt');
var { encode, decode } = require('../helpers/hash');
var jwt = require('jsonwebtoken');
var config = require('config');
var mailer = require('../helpers/mailer');
var moment = require('moment');
const { Mongoose } = require('mongoose');
const mongo = require("mongodb");
var CronJob = require('cron').CronJob;
const stripeSecretKey = config.get('stripe').SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);

const ObjectID = mongo.ObjectID;

/**
 * vendorController.js
 *
 * @description :: Server-side logic for managing vendors.
 */
module.exports = {

    /**
     * vendorController.register()
     */
    register: async function (req, res) {
        console.log("hello")
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        var vendorJson, vendor;
        const { firstName, lastName, userName, phone, email, streetAddress1, streetAddress2, city, region, country, postalCode, website, shopName } = req.body;
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
                    streetAddress1,
                    streetAddress2,
                    city,
                    region,
                    country,
                    postalCode,
                    website,
                    shopName,
                    userName
                });
                console.log("vendor", vendor);

            }

        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        // send email confirmation mail to vendor
        try {
            mailData = {
                to: 'support@clikiko.com',
                subject: "New Business Request | Clikiko",
                template: 'request',
                data: {
                    name: (vendor.firstName) + ' ' + (vendor.lastName),
                    email: vendor.email,
                    shopName: vendor.shopName,
                    userName: vendor.userName
                }
            }
            mailer.sendMail(mailData);
        } catch (error) {
            console.log(error)
        }

        // send email confirmation mail to vendor
        // try {
        //     vendor.token = encode(vendor._id);
        //     await vendor.save();
        //     mailData = {
        //         to: vendor.email,
        //         subject: "Welcome to Clikiko",
        //         template: 'welcome',
        //         data: {
        //             name: vendor.firstName + ' ' + vendor.lastName,
        //             url: 'https://business.clikiko.com' + '/vendor/verify-account/' + vendor.token
        //         }
        //     }
        //     mailer.sendMail(mailData);
        // } catch (error) {
        //     console.log(error)
        // }

        return res.status(200).json({
            data: vendorJson,
            status: true,
            message: 'Registered successfully',
        });
    },

    /**
     * vendorController.verifyAccount()
     */
    verifyAccount: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { token } = req.body;
        try {

            // Check vendor existence
            let checkVendor = await Vendor.findOne({
                token: token
            });
            if (!checkVendor) {
                return res.status(400).json({
                    status: false,
                    message: "'create password Link' expired, Enter the email to generate a new link",
                });
            } else {
                //const password = generateRandomString(8);
                checkVendor.token = generateRandomString(12);
                checkVendor.isEmailVerified = true;
                //checkVendor.password = await bcrypt.hash(password, 10);
                await checkVendor.save();
         
                // mailData = {
                //     to: checkVendor.email,
                //     subject: "Create Password | Clikiko",
                //     template: 'create_password',
                //     data: {
                //         name: checkVendor.firstName + ' ' + checkVendor.lastName,
                //         url:   'https://business.clikiko.com' + '/vendor/reset-password/' + checkVendor.token
                //     }
                // }
                // mailer.sendMail(mailData);
                return res.status(200).json({
                    status: true,
                    token:  checkVendor.token,
                    message : "Email verify successfully"
                });
                // const mailData = {
                //     to: checkVendor.email,
                //     subject: "Credentials | Clikiko",
                //     template: 'credentials',
                //     data: {
                //         name: checkVendor.firstName + ' ' + checkVendor.lastName,
                //         url: 'https://business.clikiko.com' + '/login',
                //         email: checkVendor.email,
                //         password: password
                //     }
                // }
                // mailer.sendMail(mailData);
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

    /** *
     * venderController.verifyEmail()
     */
    verifyEmail: async function (req, res) {
        try {
            const { email } = req.body;

            let vendor = await Vendor.findOne({
                email: email
            });

            if (!vendor) {
                return res.status(400).json({
                    status: false,
                    message: "Please check, Email is invalid",
                });
            } else {
                try {
                    vendor.token = encode(vendor._id);
                    await vendor.save();
                    mailData = {
                        to: vendor.email,
                        subject: "Welcome to Clikiko",
                        template: 'welcome',
                        data: {
                            name: vendor.firstName + ' ' + vendor.lastName,
                            url: 'https://business.clikiko.com' + '/vendor/verify-account/' + vendor.token
                        }
                    }
                    mailer.sendMail(mailData);

                    let setTime = '* */24 * * *';
                    //let   setTime = '* * * * *';
                     var job = new CronJob(setTime, async () => {
                         let vendordata =  await Vendor.findOneAndUpdate({ _id: vendor._id },{ token : '' }, { new: true })
                         console.log("vendordata",vendordata)
                         if(vendordata){
                             job.stop()
                         }
                     }, null, true, '');
                     job.start();
                } catch (error) {
                    console.log(error)
                    return res.status(500).json({
                        error: error,
                        status: false,
                        message: 'Something went wrong',
                    });
                }

            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
        return res.status(200).json({
            status: true,
            message: 'A create password link sent to your mail',
        });
    },
    /**
     * vendorController.forgotPassword()
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
        let checkVendor, mailData;
        try {
            checkVendor = await Vendor.findOne({
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

        if (checkVendor) {
            try {
                checkVendor.token = generateRandomString(12);
                await checkVendor.save();
                mailData = {
                    to: checkVendor.email,
                    subject: "Reset Password | Clikiko",
                    template: 'reset_password',
                    data: {
                        name: checkVendor.firstName + ' ' + checkVendor.lastName,
                        url: 'https://business.clikiko.com' + '/vendor/reset-password/' + checkVendor.token
                    }
                }
                mailer.sendMail(mailData);
                return res.status(200).json({
                    status: true,
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
                message: 'User not found'
            });
        }
    },

    /**
     * vendorController.resetPassword()
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
            let checkVendor = await Vendor.findOne({
                token: req.body.token
            });
            if (checkVendor) {
                // if(!checkVendor.token) {
                //     return res.status(400).json({
                //         status: false,
                //         message: 'Reset link is expired, generate a new one.'
                //     });
                // }
                // let vendorJson = checkVendor.toJSON();
                checkVendor.password = await bcrypt.hash(req.body.password, 10);
                checkVendor.token = '';
                await checkVendor.save();
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
     * vendorController.changePassword()
     */
    changePassword: async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            let checkVendor = await Vendor.findOne({
                _id: req.user._id
            });
            if (checkVendor) {
                const match = await bcrypt.compare(req.body.oldPassword, checkVendor.password);
                if (!match) {
                    return res.status(400).json({
                        status: false,
                        message: 'Old password didn\'t match'
                    });
                }
                checkVendor.password = await bcrypt.hash(req.body.password, 10);
                checkVendor.token = '';
                await checkVendor.save();
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

    /**
     * vendorController.login()
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
            let checkVendor = await Vendor.findOne({
                email: req.body.email
            });
            if (!checkVendor) {
                return res.status(400).json({
                    status: false,
                    message: 'User does not exist',
                });
            } else {
                if(checkVendor.password){
                    const match = await bcrypt.compare(req.body.password, checkVendor.password);
                    if (!match) {
                        return res.status(400).json({
                            status: false,
                            message: 'Invalid credentails',
                        });
                    } else {
                        let vendorJson = checkVendor.toJSON();
                        if (vendorJson.status == 0) {
                            return res.status(400).json({
                                status: false,
                                message: 'Your account has been inactive. Please contact with administrator.',
                            });
                        }
                        if (!vendorJson.isEmailVerified) {
                            return res.status(400).json({
                                status: false,
                                message: 'Your account is not active yet, please check your mail to  create your password and activate your account',
                            });
                        }
                        if (vendorJson.isApproved == 'pending') {
                            return res.status(400).json({
                                status: false,
                                message: 'Admin didn\'t approve your business. Please contact admin',
                            });
                        }
                        if (vendorJson.isApproved == 'rejected') {
                            return res.status(400).json({
                                status: false,
                                message: 'Your business account has been rejected,Contact us at support@clikiko.com ',
                            });
                        }
                        vendorJson.role = 'vendor';
                        vendorJson.token = jwt.sign(vendorJson, config.get('site.secret'));
                        delete vendorJson.password;
                        return res.status(200).json({
                            data: vendorJson,
                            status: true,
                            message: 'Login successfully',
                        });
                    }
                }else{
                    return res.status(400).json({
                                status: false,
                                message: 'Your account is not active yet, please check your mail to  create your password and activate your account',
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
     * vendorController.update()
     */
    update: async function (req, res) {
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
        let vendor, getVendorInfo;
        const { _id } = req.user;
        try {
            if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
            // constructing dynamic query
            for (let i = 0; i < entries.length; i++) {
                updates[entries[i]] = Object.values(req.body)[i]
            }
            // update profile
            vendor = await Vendor.updateOne({ _id }, { $set: updates })
            getVendorInfo = await Vendor.findOne({ _id: req.user._id })
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            data: getVendorInfo,
            status: true,
            message: 'Profile updated successfully',
        });
    },

    /**
     * vendorController.getProfile()
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
            // Check vendor existence
            let checkVendor = await Vendor.findOne({
                _id: req.user._id
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


    checkUsernameExistence: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {

            // Check username existence
            let checkUser = await Vendor.find({
                userName: req.body.userName
            });
            console.log("checkUser", checkUser)
            if (checkUser.length > 0) {
                return res.status(400).json({
                    status: false,
                    message: "Username already taken",
                });
            } else {
                return res.status(200).json({
                    status: true,
                    message: 'Username available',
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
    /**
     * vendorController.lineGraph()
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
            const vendorId = req.user._id;
            let totalClicks = 0;
            let graphData = [];
            let finalResult;
            let counter = 0;
            let matchQuery = {
                $match: {
                    updatedAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                    vendorId: ObjectID(vendorId),
                },
            }

            if (req.body.productId) {
                matchQuery = {
                    $match: {
                        updatedAt: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate),
                        },
                        vendorId: ObjectID(vendorId),
                        productId: ObjectID(req.body.productId)
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
            //range view
            if (req.query.range) {
                console.log('StartDate', startDate);
                console.log('endDate,', endDate);
                values = getDateRange(startDate, (moment(endDate).diff(startDate, 'days')) + 2);
                console.log(values);
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

            //Logic for month and week
            if (req.query.week || req.query.month || req.query.range) {
                let salesResult = await Click.aggregate(salesQuery);
                console.log("salesResult", salesResult);
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
     * vendorController.addCardToStripe()
     */
    addCardToStripe: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }

        const { name, email, token } = req.body;
        const { _id } = req.user;
        try {
            // const vendor = await Vendor.findOne({_id})
            // Create a Customer:
            const customer = await stripe.customers.create({
                // name: vendor.firstName + " " + vendor.lastName,
                // email: vendor.email,
                // address: {
                //     city: vendor.city,
                //     country: vendor.country,
                //     line1: vendor.addressLine1,
                //     line2: vendor.addressLine2,
                //     postal_code: vendor.postalCode,
                //     state: vendor.region
                // },
                name: name,
                email: email,
                address: {
                    city: 'Houston',
                    country: 'US',
                    line1: '771',
                    line2: 'Michael Street',
                    postal_code: '77007',
                    state: 'Texas'
                },
            });

            if (customer) {
                // Add card to created Customer:
                const card = await stripe.customers.createSource(
                    customer.id,
                    {
                        source: token
                    }
                );
                let cardSource = card.id;
                // switch (card.brand) {
                //     case 'Visa':
                //         cardSource = 'tok_visa';
                //         break;
                //     case 'Visa (debit)':
                //         cardSource = 'tok_visa_debit';
                //         break;
                //     case 'Mastercard':
                //         cardSource = 'tok_mastercard';
                //         break;
                //     case 'Mastercard (debit)':
                //         cardSource = 'tok_mastercard_debit';
                //         break;
                //     case 'Mastercard (prepaid)':
                //         cardSource = 'tok_mastercard_prepaid';
                //         break;
                //     case 'American Express':
                //         cardSource = 'tok_amex';
                //         break;
                //     case 'Discover':
                //         cardSource = 'tok_discover';
                //         break;
                //     case 'Diners Club':
                //         cardSource = 'tok_diners';
                //         break;
                //     case 'JCB':
                //         cardSource = 'tok_jcb';
                //         break;
                //     case 'UnionPay':
                //         cardSource = 'tok_unionpay';
                //         break;
                //     default:
                //         cardSource = 'tok_visa';
                //         break;
                // }
                // Update customer id:
                await Vendor.updateOne({ _id }, { $set: { cardSource, customerId: customer.id } })
            } else {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid details',
                });
            }

            return res.status(200).json({
                status: true,
                message: 'Card added',
            });
        } catch (err) {
            console.log(err)
            // switch (err.type) {
            //     case 'StripeCardError':
            //         // A declined card error
            //         err.message = "Your card's expiration year is invalid."
            //         break;
            //     case 'StripeRateLimitError':
            //         err.message = "Too many requests made to the API too quickly"
            //         break;
            //     case 'StripeInvalidRequestError':
            //         err.message = "Invalid parameters were supplied to Stripe's API"
            //         break;
            //     case 'StripeAPIError':
            //         err.message = "An error occurred internally with Stripe's API"
            //         break;
            //     case 'StripeConnectionError':
            //         err.message = "Some kind of error occurred during the HTTPS communication"
            //         break;
            //     case 'StripeAuthenticationError':
            //         err.message = "You probably used an incorrect API key"
            //         break;
            //     default:
            //         err.message = "Session expired"
            //         break;
            // }
            if (err.code == "resource_missing") {
                return res.status(400).json({
                    status: false,
                    message: 'Session expired',
                });
            }
            if (err.code == "token_already_used") {
                return res.status(400).json({
                    status: false,
                    message: 'Request already processed',
                });
            }
            return res.status(500).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
    },

    /**
     * vendorController.dashboardCount()
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
            const vendorId = req.user._id;
            // Products count
            const products = await Product.countDocuments({ addedBy: vendorId });
            // Total clicks count
            const clicks = await Click.countDocuments({ vendorId });

            const deductionResult = await Revenue.aggregate([{
                $match: { vendorId: ObjectID(vendorId) }
            },
            {
                "$group": {
                    "_id": vendorId,
                    "total": {
                        "$sum": {
                            "$toDouble": "$cost"
                        }
                    },
                }
            }
            ])
            // console.log("deduction Result",deductionResult)
            var deduction = 0;
            if (deductionResult && deductionResult[0] && deductionResult[0].total) deduction = deductionResult[0].total


            return res.status(200).json({
                data: { products, clicks, deduction },
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
     * vendorController.getCardDetail()
     */
    cardDetail: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            // Check vendor existence
            let checkVendor = await Vendor.findOne({
                _id: req.user._id
            });
            if (checkVendor.customerId && checkVendor.cardSource) {
                const card = await stripe.customers.retrieveSource(
                    checkVendor.customerId,
                    checkVendor.cardSource
                );
                return res.status(200).json({
                    status: true,
                    data: card,
                    message: "Card detail",
                });
            } else {
                return res.status(200).json({
                    status: false,
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

    /**
     * vendorController.removeCardDeatil()
     */
    removeCardDetail: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            // Check vendor existence
            let checkVendor = await Vendor.findOneAndUpdate({ _id: req.user._id }, { cardSource: "" }, { new: true });
            if (checkVendor) {
                return res.status(200).json({
                    status: true,
                    // data: card,
                    message: "Card delete successfully",
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

    /**
    * vendorController.paymentDetail()
    */
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
            // Check vendor existence
            let groupList
            let paymentMethods
            const { page, limit, query, startDate, endDate } = req.query;
            console.log("req.user._id", req.user._id)
            let checkRevenue = await Revenue.find({
                vendorId: req.user._id,
                createdAt: { $gte: (startDate), $lte: (endDate) }
            }).populate("vendorId").populate("productId").limit(((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
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


