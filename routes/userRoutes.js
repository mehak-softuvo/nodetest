var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');
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
        fileSize: 1024 * 1024 * 5,
        fileFilter   
    } 
    
})

/*
 * GET
 */
router.get('/getProfile', apiGuard, userController.getProfile);

/*
 * POST
 */
router.post('/forgot_password',  userController.forgotPasswordPanel);
router.post('/reset_password', userController.resetPasswordPanel);
router.post('/register', validator.validate('register'), userController.register);
router.post('/checkUsernameExistence', validator.validate('checkUsernameExistence'), userController.checkUsernameExistence);
router.post('/checkUserExistence', userController.checkUserExistence);
router.post('/forgotPassword', validator.validate('forgotPassword'), userController.forgotPassword);
router.post('/resetPassword', validator.validate('resetPassword'), userController.resetPassword);
router.post('/login', validator.validate('login'), userController.login);
router.post('/generateEmailOTP', validator.validate('forgotPassword'), userController.generateEmailOTP);
router.post('/changePassword', apiGuard, validator.validate('changePassword'), userController.changePassword);
router.post('/updatePreferences', apiGuard, validator.validate('updatePreferences'), userController.updatePreferences);
router.post('/update', apiGuard, upload.single('image'), userController.update);
router.post('/generatePhoneOTP', validator.validate('generatePhoneOTP'), userController.generatePhoneOTP);
router.post('/validatePhoneOTP', validator.validate('validatePhoneOTP'), userController.validatePhoneOTP);
// router.post('/resentEmailOtp', validator.validate('forgotPassword'), userController.resentEmailOtp);



/*
 * PUT
 */

/*
 * PATCH
 */

/*
 * DELETE
 */


module.exports = router;
