var Query = require('../models/queryModel.js');
var Static = require('../models/staticModel.js');
const { validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
var config = require('config');
var mailer = require('../helpers/mailer');

/**
 * queryController.js
 *
 * @description :: Server-side logic for managing queries.
 */
module.exports = {

    /**
     * queryController.add()
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
        let query;
        if(!req.body.phone && !req.body.email) {
            return res.status(200).json({
                status: false,
                message: 'Either phone or email is required',
            });
        }
        try {
            query = await Query.create(req.body);

        } catch (err) {
            console.log(err)
            return res.status(200).json({
                error: err,
                status: false,
                message: 'Something went wrong',
            });
        }

        return res.status(200).json({
            status: query,
            wishlisted: true,
            message: 'Query added',
        });
    }
}