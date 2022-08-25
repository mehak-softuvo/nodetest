var User = require('../models/userModel.js');
var OTP = require('../models/otpModel.js');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
var { encode, decode } = require('../helpers/hash');
var jwt = require('jsonwebtoken');
var config = require('config');
var mailer = require('../helpers/mailer');
const mongoose = require('mongoose');
const twilio = config.get('twilio');
const accountSid = twilio.TWILIO_ACCOUNT_SID;
const authToken = twilio.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    /**
     * userController.register()
     */
    register: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        var userJson, user;
        try {

            // Create new user
            req.body.password = await bcrypt.hash(req.body.password, 10);
            if (req.body.phone) {
                // Check user existence
                let checkUser = await User.findOne({
                    phone: req.body.phone
                });
                if (checkUser) {
                    return res.status(200).json({
                        status: false,
                        message: "Phone number already exist",
                    });
                }
                user = await User.create({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    username: req.body.username,
                    dob: req.body.dob,
                    phone: req.body.phone,
                    password: req.body.password,
                    email: req.body.email
                });
            } else if (req.body.email) {
                // Check user existence
                const checkUser = await User.findOne({
                    email: req.body.email
                });
                if (checkUser) {
                    return res.status(200).json({
                        status: false,
                        message: "Email already exist",
                    });
                }
                // Validate OTP
                const checkOTP = await OTP.findOne({
                    email: req.body.email
                });
                if (checkOTP && checkOTP.otp) {
                    if (checkOTP.otp != req.body.otp) {
                        return res.status(200).json({
                            status: false,
                            message: "Invalid OTP",
                        });
                    }
                } else {
                    return res.status(200).json({
                        status: false,
                        message: "OTP expired, please generate a new one",
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
            userJson = user.toJSON();
            userJson.role = 'user';
            userJson.token = jwt.sign(userJson, config.get('site.secret'));

        } catch (err) {
            console.log(err)
            return res.status(200).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        // send welcome mail to user
        // try {
        //     mailData = {
        //         to: user.email,
        //         subject: "Welcome to Clikiko",
        //         template: 'welcome',
        //         data: {
        //             name: user.firstName + ' ' + user.lastName,
        //             url: config.get('site.url') + '/user/login'
        //         }
        //     }
        //     mailer.sendMail(mailData);
        // } catch (error) {
        //     console.log(error)
        // }

        return res.status(200).json({
            data: userJson,
            status: true,
            message: 'Registered successfully',
        });
    },

    /**
     * userController.checkUsernameExistence()
     */
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
            const checkUser = await User.findOne({
                username: req.body.username
            });
            if (checkUser) {
                return res.status(200).json({
                    status: false,
                    message: "Username already taken",
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

        return res.status(200).json({
            status: true,
            message: 'Username available',
        });
    },

    /**
     * userController.checkUserExistence()
     */
    checkUserExistence: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            const { phone, email } = req.body;
            if (!phone && !email) {
                return res.status(200).json({
                    status: false,
                    message: 'Either phone or email is required',
                });
            }
            let checkUser;
            // Check user existence
            if (phone) {
                checkUser = await User.findOne({
                    phone: phone
                });
            } else {
                checkUser = await User.findOne({
                    email: email
                });
            }
            if (checkUser) {

                return res.status(200).json({
                    status: false,
                    message: phone ? 'User already exist with this phone number' : 'User already exist with this email',
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

        return res.status(200).json({
            status: true,
            message: 'No user exist with the provided information',
        });
    },



    forgotPasswordPanel: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let checkUser, mailData;
        try {
            checkUser = await User.findOne({
                email: req.body.email
            });
        } catch (err) {
            console.log(err)
            return res.status(200).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        if (checkUser) {
            try {
                checkUser.token = encode(checkUser._id);
                await checkUser.save();
                mailData = {
                    to: checkUser.email,
                    subject: "Reset Password | Clikiko",
                    template: 'reset_password',
                    data: {
                        name: checkUser.firstName + ' ' + checkUser.lastName,
                        url: 'https://admin.clikiko.com' + '/user/reset-password/' + encode(checkUser._id)
                        // url: config.get('site.url') + '/user/reset-password/' + (otp)

                    }
                }
                mailer.sendMail(mailData);
                return res.status(200).json({
                    status: true,
                    message: 'A reset password link sent to your mail',
                });
            } catch (err) {
                console.log(err)
                return res.status(200).json({
                    error: err,
                    status: false,
                    message: 'Something went wrong',
                });
            }
        } else {
            return res.status(200).json({
                status: false,
                message: 'User not found'
            });
        }
    },

    resetPasswordPanel: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            if(req.body.token){
                let checkUser = await User.findOne({
                    _id: decode(req.body.token)
                 });
                 console.log("checkUser", checkUser);
                 if (checkUser) {
                    // let userJson = checkUser.toJSON();githubgithub
                    let password = await bcrypt.hash(req.body.password, 10);
                //    checkUser.token= '';
                   let updateUser = await User.findOneAndUpdate({ _id: decode(req.body.token) }, { password: password, token: '' }, { new: true })
                   console.log('updateUser===============>', updateUser)
                   // await checkUser.save();
                    if (updateUser) {
                        return res.status(200).json({
                            status: true,
                            // password:password,
                            message: 'Password Changed Sucessfully',
                        });
                    }else{
                        return res.status(200).json({
                            status: false,
                        
                            message: 'Invalid Token',
                        });
                    }
                } else {
                    return res.status(200).json({
                        status: false,
                        message: 'Invalid Token'
                    });
                }
            }
          
            
          
        } catch (error) {
            return res.status(400).json({
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
    * userController.forgotPassword()
    */
    forgotPassword: async function (req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let checkUser, mailData;
        try {
            checkUser = await User.findOne({
                email: req.body.email
            });
        } catch (err) {
            console.log(err)
            return res.status(200).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        if (checkUser) {
            try {
                const otp = generateRandomOtp(4);
                console.log("000", otp)
                // checkUser.token = encode(checkUser._id);
                checkUser.token = otp
                await checkUser.save();
                mailData = {
                    to: checkUser.email,
                    subject: "Reset Password | Clikiko",
                    template: 'reset_password',
                    data: {
                        name: checkUser.firstName + ' ' + checkUser.lastName,
                        otp: otp,
                        // url: config.get('site.url') + '/user/reset-password/' + encode(checkUser._id)
                        // url: config.get('site.url') + '/user/reset-password/' + (otp)

                    }
                }
                mailer.sendMail(mailData);
                return res.status(200).json({
                    status: true,
                    message: 'A reset password link sent to your mail',
                });
            } catch (err) {
                console.log(err)
                return res.status(200).json({
                    error: err,
                    status: false,
                    message: 'Something went wrong',
                });
            }
        } else {
            return res.status(200).json({
                status: false,
                message: 'User not found'
            });
        }
    },

    /**
     * userController.resetPassword()
     */
    resetPassword: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            if(req.body.email){
                let checkOtp = await OTP.findOne({
                    email:req.body.email
                 });
                 console.log("checkUser", checkOtp);
                 if (checkOtp.otp==req.body.otp) {
                    // let userJson = checkUser.toJSON();
                    let checkUser = await User.findOne({
                        email:checkOtp.email
                     });
                    checkUser.password = await bcrypt.hash(req.body.password, 10);
                    await OTP.deleteOne({
                        otp:req.body.otp
                     });
                    // checkUser.otp = '';
                    await checkUser.save();
                } else {
                    return res.status(200).json({
                        status: false,
                        message: 'Invalid OTP'
                    });
                }
            }
            if(req.body.phone){
                console.log("hello")
                let checkUser = await User.findOne({
                    phone:req.body.phone
                 });
                 console.log("chechkUser",checkUser)
                 if(checkUser){
                    checkUser.password = await bcrypt.hash(req.body.password, 10);
                    await checkUser.save();
                 }else{
                    return res.status(200).json({
                        status: false,
                        message: 'Invalid OTP'
                    });
                 }
                
            }
            
          
        } catch (error) {
            return res.status(200).json({
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
     * userController.changePassword()
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
            let checkUser = await User.findOne({
                _id: req.user._id
            });
            if (checkUser) {
                const match = await bcrypt.compare(req.body.oldPassword, checkUser.password);
                if (!match) {
                    return res.status(200).json({
                        status: false,
                        message: 'Old password didn\'t match'
                    });
                }
                checkUser.password = await bcrypt.hash(req.body.password, 10);
                checkUser.token = '';
                await checkUser.save();
            } else {
                return res.status(200).json({
                    status: false,
                    message: 'Invalid User.'
                });
            }
        } catch (error) {
            return res.status(200).json({
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
     * userController.login()
     */
    login: async function (req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            let checkUser;
            if (req.body.phone) {
                checkUser = await User.findOne({ phone: req.body.phone });
            } else {
                checkUser = await User.findOne({ email: req.body.email });
            }
            if (!checkUser) {
                return res.status(200).json({
                    status: false,
                    message: 'User does not exist',
                });
            } else {
                const match = await bcrypt.compare(req.body.password, checkUser.password);
                if (!match) {
                    return res.status(200).json({
                        status: false,
                        message: 'Invalid credentails',
                    });
                } else {
                    let userJson = checkUser.toJSON();
                    if (userJson.status == 0) {
                        return res.status(200).json({
                            status: false,
                            message: 'Your account has been inactive. Please contact with administrator.',
                        });
                    }
                    userJson.role = 'user';
                    userJson.token = jwt.sign(userJson, config.get('site.secret'));
                    delete userJson.password;
                    return res.status(200).json({
                        data: userJson,
                        status: true,
                        message: 'Login successfully',
                    });
                }
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
     * userController.updatePreferences()
     */
    updatePreferences: async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { categories } = req.body;
        try {
            let checkUser = await User.findOne({
                _id: req.user._id
            });
            if (checkUser) {
                checkUser.preferredCategories = categories;
                await checkUser.save();
            } else {
                return res.status(200).json({
                    status: false,
                    message: 'Invalid User.'
                });
            }
        } catch (error) {
            return res.status(200).json({
                status: false,
                message: 'Something went wrong.'
            });
        }
        return res.status(200).json({
            status: true,
            message: 'Preferences updated successfully.',
        });
    },

    /**
     * userController.update()
     */
    update: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let user;
        const { _id } = req.user;
        if (req.file) {
            req.body['image'] = '/uploads/' + req.file.filename;
        }
        const entries = Object.keys(req.body)
        const updates = {}
        try {
            if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);

            // constructing dynamic query
            for (let i = 0; i < entries.length; i++) {
                updates[entries[i]] = Object.values(req.body)[i]
            }
            // update profile
            await User.updateOne({ _id }, { $set: updates })
            user = await User.findOne({ _id })
        } catch (err) {
            console.log(err)
            return res.status(200).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            data: user,
            status: true,
            message: 'Profile updated successfully',
        });
    },

    /**
     * userController.getProfile()
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
            // Check user existence
            let checkUser = await User.findOne({
                _id: req.user._id

            });
            if (checkUser) {
                return res.status(200).json({
                    status: true,
                    data: checkUser,
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
            return res.status(200).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }
    },

    /**
     * userController.generateEmailOTP()
     */
    generateEmailOTP: async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            const email = req.body.email
            const otp = generateRandomOtp(4);
            let entry = await OTP.findOne({
                email
            });
            if (entry) {
                entry.otp = otp;
                await entry.save();
            } else {
                entry = await OTP.create({ email, otp })
            }
            if (entry) {

                mailData = {
                    to: entry.email,
                    subject: "OTP | Clikiko",
                    template: 'email_otp',
                    data: {
                        otp: entry.otp
                    }
                }
                mailer.sendMail(mailData);
                setTimeout(async function () {
                    await OTP.findOneAndRemove({ _id: entry._id });
                }, 1000 * 60 * 3); // 3 mins

                return res.status(200).json({
                    status: true,
                    message: 'Please check your mail for the OTP',
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
     * userController.generatePhoneOTP()
     */
    generatePhoneOTP: async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            const { phone } = req.body
            const checkUser = await User.findOne({
                phone
            });
            if (!checkUser) {
                return res.status(200).json({
                    status: false,
                    message: 'User not found',
                });
            }
            const otp = generateRandomOtp(4);
            let entry = await OTP.findOne({
                phone
            });
            if (entry) {
                entry.otp = otp;
                await entry.save();
            } else {
                entry = await OTP.create({ phone, otp })
            }

            await client.messages
            .create({
                body: entry.otp + ' is your OTP to verify the number.',
                from: twilio.TWILIO_PHONE_NUMBER,
                to: phone
            })
            .then(message => console.log(message.sid));

            setTimeout(async function () {
                await OTP.findOneAndRemove({ _id: entry._id });
            }, 1000 * 60 * 3); // 3 mins

            return res.status(200).json({
                status: true,
                data: entry.otp,
                message: 'OTP sent on your number',
            });
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
     * userController.validatePhoneOTP()
     */
    validatePhoneOTP: async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            const { phone, otp } = req.body;
            // Validate OTP
            const checkOTP = await OTP.findOne({
                phone
            });
            if (checkOTP && checkOTP.otp) {
                if (checkOTP.otp != otp) {
                    return res.status(200).json({
                        status: false,
                        message: "Invalid OTP",
                    });
                }
            } else {
                return res.status(200).json({
                    status: false,
                    message: "OTP expired, please generate a new one",
                });
            }
            const checkUser = await User.findOne({
                phone
            });
            if (checkUser) {
                checkUser.token = encode(checkUser._id);
                await checkUser.save();
                return res.status(200).json({
                    status: true,
                    data: checkUser.token,
                    message: 'OTP verified',
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: 'Invalid user',
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
     * userController.resentEmailOtp()
     */
    resentEmailOtp: async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(200).json({
                // error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        try {
            let email = req.body.email
            let otp_token = generateRandomOtp(4);
            let updateOTP = await User.findOneAndUpdate({ email: email }, { otp: otp_token }, { new: true })
            if (updateOTP) {
                mailData = {
                    to: updateOTP.email,
                    subject: "User OTP",
                    template: 'sent_otp',
                    data: {
                        otp: updateOTP.otp,
                        name: updateOTP.firstName + ' ' + updateOTP.lastName,
                        // url: config.get('site.url') + '/user/reset-password/' + encode(checkUser._id)
                    }
                }
                mailer.sendMail(mailData);
                setTimeout(async function () {
                    let updateOTP = await User.findOneAndUpdate({ email: email }, { otp: "" }, { new: true })
                }, 180000); // set 3 min
                return res.status(200).json({
                    status: true,
                    message: 'A OTP relink sent to your mail please check!!',
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

function generateRandomOtp(length = 4) {
    let OTP = '';
    let digits = "0123456789";
    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

function generateRandomString(length = 8) {
    let string = '';
    let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < length; i++) {
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
}