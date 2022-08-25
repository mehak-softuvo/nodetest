var express = require('express');
var router = express.Router();
var vendorController = require('../controllers/vendorController.js');
var apiGuard = require('../middleware/api-guard');
var validator = require('../middleware/validator');
var multer = require('multer');

const storage = multer.diskStorage({
   destination: function(req, file, cb){
       cb(null, './uploads');
   },
   filename: function(req, file, cb){
       cb(null, new Date().getTime()+'-' + file.originalname)
   }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'){
        cb(null, true);
    } else{
        cb(null, false);
    }
}
var upload = multer({
    storage,
    limits: {
        fileSize: 200 * 200 * 5,
        fileFilter   
    } 
    
})

/*
 * GET
 */
router.get('/getProfile', apiGuard, vendorController.getProfile);
router.get('/dashboardCount', apiGuard, vendorController.dashboardCount);
router.get('/cardDetail', apiGuard, vendorController.cardDetail);
router.get('/paymentDetail', apiGuard, vendorController.paymentDetail);


/*
 * POST
 */
router.post('/register', validator.validate('vendorRegister'), vendorController.register);
router.post('/verifyAccount', validator.validate('verifyAccount'), vendorController.verifyAccount);
router.post('/generateVerifyEmailLink',vendorController.verifyEmail);
router.post('/forgotPassword', validator.validate('forgotPassword'), vendorController.forgotPassword);
router.post('/resetPassword', validator.validate('resetPasswordVA'), vendorController.resetPassword);
router.post('/login', validator.validate('vendorLogin'), vendorController.login);
router.post('/lineGraph', apiGuard, validator.validate('lineGraph'), vendorController.lineGraph);
router.post('/addCardToStripe', apiGuard, validator.validate('addCardToStripe'), vendorController.addCardToStripe);
router.post('/checkUsernameExistence', vendorController.checkUsernameExistence);



/*
 * PUT
 */
router.put('/changePassword', apiGuard, validator.validate('changePassword'), vendorController.changePassword);

/*
 * PATCH
 */
router.patch('/update', upload.single('shopImage'), apiGuard, vendorController.update);

/*
 * DELETE
 */
router.delete('/removeCardDetail', apiGuard, vendorController.removeCardDetail);


module.exports = router;
