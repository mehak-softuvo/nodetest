var express = require('express');
var router = express.Router();
var testController = require('../controllers/testController.js');
var validator = require('../middleware/validator');

/*
 * GET
 */
router.get('/list', validator.validate('list'), testController.list);

module.exports = router;
