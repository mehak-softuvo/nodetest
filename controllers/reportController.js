var Report = require('../models/reportModel.js');
var Static = require('../models/staticModel.js');
const { validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
var config = require('config');
var mailer = require('../helpers/mailer');

/**
 * reportController.js
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
            return res.status(200).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { type, productId, vendorId } = req.body;
        if (type == 'product' && !productId) {
            return res.status(200).json({
                status: false,
                message: 'productId is required',
            });
        } else if (type == 'vendor' && !vendorId) {
            return res.status(200).json({
                status: false,
                message: 'vendorId is required',
            });
        }
        let report;
        req.body.addedBy = req.user._id;
        try {
            report = await Report.create(req.body);

        } catch (err) {
            console.log(err)
            return res.status(200).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            status: report,
            wishlisted: true,
            message: 'Reported successfull',
        });
    },

    /**
    * reportController.listReportOptions()
    */
    listReportOptions: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let reportOptions;
        let limit = 0;
        let page = 1;
        if (req.query.limit) {
            limit = req.query.limit
        }
        if (req.query.limit) {
            page = req.query.page
        }

        let to, total = 0
        let countdata;
        try {
            countdata = await Static.find({ slug: 'report' })
            total = countdata.length
            reportOptions = await Static.find({ slug: 'report' }).sort({ createdAt: -1 }).skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));
            if (reportOptions && reportOptions.length) {
                to = (parseInt(page) - 1) * parseInt(limit) + reportOptions.length;

            } else {
                to = countdata.length;
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
            data: reportOptions, to, total,
            message: 'Report options'
        });
    },

    /**
     * reportController.listProductReports()
     */
    listProductReports: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        const { page, limit, type } = req.query;
        let reports, reportCount;
        try {
            reports = await Report.find({ type: type }).populate("vendorId").populate('addedBy').populate('productId').sort({ createdAt: -1 }).skip((parseInt(page) - 1) * parseInt(limit)).limit(((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit));
            reportCount = await Report.find({ type: type }).countDocuments();
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
            data: { reports, reportCount },
            message: 'Product reports'
        });
    },
    /**
   * reportController.delete options()
   */
    deleteOptions: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let reportOptions;

        let reportId = req.body.reportId
        try {
            reportOptions = await Static.findOneAndDelete({ _id: reportId });
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
            data: reportOptions,
            message: 'Report delete successfully'
        });
    },

    /**
   * reportController.update options()
   */
    updateOption: async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array(),
                status: false,
                message: errors.array()[0].msg
            });
        }
        let reportOptions;
        let reportId = req.body.reportId
        try {
            reportOptions = await Static.findOneAndUpdate({ _id: reportId }, { $set: req.body }, { new: true });
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
            data: reportOptions,
            message: 'Report updated successfully'
        });
    },
}