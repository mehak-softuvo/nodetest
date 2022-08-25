var express = require('express');
var router = express.Router();
var wishlistController = require('../controllers/wishlistController.js');
var apiGuard = require('../middleware/api-guard');
var validator = require('../middleware/validator');

/*
 * GET
 */
router.get('/', apiGuard, validator.validate('list'), wishlistController.list);

/*
 * POST
 */
router.post('/add', apiGuard, validator.validate('addWishlist'), wishlistController.add);
router.post('/remove', apiGuard, validator.validate('removeWishlist'), wishlistController.remove);

/*
 * DELETE
 */


module.exports = router;
