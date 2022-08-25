var express = require('express');
var router = express.Router();
var termController = require('../controllers/termController.js');
var apiGuard = require('../middleware/api-guard');
var validator = require('../middleware/validator');


/*
 * GET
 */
router.get('/',  termController.list);
router.get('/:slug', termController.getBySlug);
// router.get('/:', termController.getById);

/*
 * POST
 */
router.post('/', termController.create);


/*
 * PUT
 */
router.put('/:id', termController.update);
/*
 * PATCH
 */

/*
 * DELETE
 */


module.exports = router;
