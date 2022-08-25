var express = require('express');
var router = express.Router();
var categoryController = require('../controllers/categoryController.js');
var apiGuard = require('../middleware/api-guard');
var validator = require('../middleware/validator');

/*
 * GET
 */
router.get('/list', apiGuard, validator.validate('list'), categoryController.list);
router.get('/listAll', apiGuard, categoryController.listAll);

/*
 * POST
 */
router.post('/create', apiGuard, validator.validate('createCategory'), categoryController.create);

/*
 * PUT
 */


/*
 * PATCH
 */
router.patch('/update/:categoryId', apiGuard, categoryController.update);

/*
 * DELETE
 */
router.delete('/delete/:categoryId', apiGuard, categoryController.delete);


module.exports = router;
