var express = require('express');
var router = express.Router();
var queryController = require('../controllers/queryController.js');
var apiGuard = require('../middleware/api-guard');
var validator = require('../middleware/validator');

/*
 * GET
 */

/*
 * POST
 */
router.post('/', apiGuard, validator.validate('addQuery'), queryController.add);

/*
 * DELETE
 */


module.exports = router;
