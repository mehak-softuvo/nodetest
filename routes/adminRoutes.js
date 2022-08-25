var express = require('express');
var router = express.Router();
var adminController = require('../controllers/adminController.js');
var adminApiGuard = require('../middleware/admin-api-guard');
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
router.get('/getProfile', adminApiGuard, adminController.getProfile);
router.get('/dashboardCount', adminApiGuard, adminController.dashboardCount);
router.get('/getVendor/:vendorId', adminApiGuard, adminController.getVendor);
router.get('/listVendors', adminApiGuard, validator.validate('list'), adminController.listVendors);
router.get('/listShopWiseRevenue', adminApiGuard, validator.validate('list'), adminController.listShopWiseRevenue);
router.get('/listAllShops', adminApiGuard, adminController.listAllShops);
router.get('/getUser/:userId', adminApiGuard, adminController.getUser);
router.get('/listUsers', adminApiGuard, validator.validate('list'), adminController.listUsers);
router.get('/listQueries', adminApiGuard, validator.validate('list'), adminController.listQueries);


/*
 * POST
 */
router.post('/login', validator.validate('login'), adminController.login);
router.post('/createVendor', adminApiGuard, validator.validate('vendorRegister'), adminController.createVendor);
router.post('/createUser', adminApiGuard, validator.validate('register'), adminController.createUser);
router.post('/createReportOptions', adminApiGuard, validator.validate('createReportOptions'), adminController.createReportOptions);
router.post('/lineGraph', adminApiGuard, validator.validate('lineGraph'), adminController.lineGraph);
router.post('/forgotPassword', validator.validate('forgotPassword'), adminController.forgotPassword);
router.post('/resetPassword', validator.validate('resetPasswordVA'), adminController.resetPassword);
router.get('/paymentList', adminController.paymentDetail);


/*
 * PUT
 */
router.put('/changePassword', adminApiGuard, validator.validate('changePassword'), adminController.changePassword);
router.put('/resetUserPassword',  adminApiGuard, adminController.resetUserPassword);

/*
 * PATCH
 */
router.patch('/update', adminApiGuard, upload.single('image'), adminController.update);
router.patch('/updateVendor/:vendorId', upload.single('shopImage'),  adminController.updateVendor);
router.patch('/updateUser/:userId', upload.single('image'), adminApiGuard, adminController.updateUser);

/*
 * DELETE
 */
router.delete('/deleteVendor/:vendorId', adminApiGuard, adminController.deleteVendor);
router.delete('/deleteUser/:userId', adminApiGuard, adminController.deleteUser);


module.exports = router;