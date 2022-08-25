var Term = require('../models/termModel.js');
const { validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
var config = require('config');
var slugify = require('slugify')
// var mailer = require('../helpers/mailer');

/**
 * Term and condition Controller.js
 *
 * @description :: Server-side logic for managing reports.
 */
module.exports = {

    /**
     * reportController.create()
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
        let term;
 
        try {
         req.body.slug = slugify((req.body.title).toLowerCase(),"-");
            term= await Term.create(req.body);

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
            message: 'date save successfully',
            data: term
        });
    },
    
     /**
     * getController.listReportOptions()
     */
    list:async function (req, res, next) {
        let GetTandC = await Term.find()
        if (!GetTandC) {
            return res.status(200)
                .json({
                    status: false,
                    message: 'something went wrong',
                    err: err
                });
        } else {
            return res.status(200)
                .json({
                    status: true,
                    message: 'Data listing',
                    data: GetTandC[0]
                });
        }
    },
    
    /**
     * updateController.listProductReports()
     */
    update:async function (req, res, next) {
    
        let GetTandC = await Term.findOneAndUpdate({ _id:req.params.id }, { $set: req.body }, {new : true});
       
        if (!GetTandC) {
            return res.status(200)
                .json({
                    status: false,
                    message: 'something went wrong',
                    err: err
                });
        } else {
            return res.status(200)
                .json({
                    status: true,
                    message: 'Data updated successfully',
                });
        }
    },

    getById:async function (req, res, next) {

        let GetTandC = await Term.findById({ _id:req.params.id });
      
        if (!GetTandC) {
            return res.status(200)
                .json({
                    status: false,
                    message: 'something went wrong',
                    err: err
                });
        } else {
            return res.status(200)
                .json({
                    status: true,
                    data :GetTandC
                });
        }
    },


    getBySlug:async function (req, res, next) {
        let GetTandC = await Term.findOne({ slug:req.params.slug });
   
        if (!GetTandC) {
            return res.status(200)
                .json({
                    status: false,
                    message: 'something went wrong',
                    err: err
                });
        } else {
            return res.status(200)
                .json({
                    status: true,
                    data :GetTandC
                });
        }
    }
}