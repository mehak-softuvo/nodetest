var express = require('express');
var router = express.Router();
var reportController = require('../controllers/reportController.js');
var apiGuard = require('../middleware/api-guard');
var validator = require('../middleware/validator');

/*
 * GET
 */
router.get('/', apiGuard, validator.validate('list'), reportController.listProductReports);
router.get('/options', apiGuard, reportController.listReportOptions);

/*
 * POST
 */
router.post('/', apiGuard, validator.validate('report'), reportController.create);
router.post('/updateOption', reportController.updateOption);

/*
 * DELETE
 */

router.post('/deleteOptions', validator.validate('deleteReport'), reportController.deleteOptions);

module.exports = router;
