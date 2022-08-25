const { check, query } = require('express-validator')

exports.validate = (method) => {
    switch (method) {
        case 'login':
            {
                return [
                    check('password').not().isEmpty().withMessage('Please enter your password')
                ]
            }
        case 'vendorLogin':
            {
                return [
                    check('email').not().isEmpty().withMessage('Please enter your email'),
                    check('email').isEmail().withMessage('Please enter a valid email'),
                    check('password').not().isEmpty().withMessage('Please enter your password')
                ]
            }
        case 'register':
            {
                return [
                    check('firstName').not().isEmpty().withMessage('Please enter your first name'),
                    check('lastName').not().isEmpty().withMessage('Please enter your last name'),
                    check('username').not().isEmpty().withMessage('Please enter username'),
                    check('dob').not().isEmpty().withMessage('Please enter dob'),
                    check('password').not().isEmpty().withMessage('Please enter your password')
                ]
            }
        case 'verifyAccount':
            {
                return [
                    check('token').not().isEmpty().withMessage('token is required')
                ]
            }
        case 'vendorRegister':
            {
                return [
                    check('firstName').not().isEmpty().withMessage('Please enter your first name'),
                    check('lastName').not().isEmpty().withMessage('Please enter your last name'),
                    check('phone').not().isEmpty().withMessage('Please enter your phone number'),
                    check('email').isEmail().withMessage('Please enter a valid email'),
                    check('streetAddress1').not().isEmpty().withMessage('Please enter your street address'),
                    check('city').not().isEmpty().withMessage('Please enter your city'),
                    check('region').not().isEmpty().withMessage('Please enter your region'),
                    check('country').not().isEmpty().withMessage('Please enter your country'),
                    check('postalCode').not().isEmpty().withMessage('Please enter your postalCode'),
                    check('shopName').not().isEmpty().withMessage('Please enter your shopName')
                ]
            }
        case 'checkUsernameExistence':
            {
                return [
                    check('username').not().isEmpty().withMessage('Please enter username')
                ]
            }
        case 'forgotPassword':
            {
                return [
                    check('email').isEmail().withMessage('Please enter a valid email')
                ]
            }
        case 'changePassword':
            {
                return [
                    check('oldPassword').not().isEmpty().withMessage('Please enter your old password'),
                    check('password').not().isEmpty().withMessage('Please enter your new password')
                ]
            }
        case 'resetPassword':
            {
                return [
                    check('otp').not().isEmpty().withMessage('otp is required'),
                    check('password').not().isEmpty().withMessage('Please enter your password')
                ]
            }
        case 'resetPasswordVA':    //vendor or admin
            {
                return [
                    check('token').not().isEmpty().withMessage('token is required'),
                    check('password').not().isEmpty().withMessage('Please enter your password')
                ]
            }
        case 'updatePreferences':
            {
                return [
                    check('categories').not().isEmpty().withMessage('Please select categories')
                ]
            }
        case 'createCategory':
            {
                return [
                    check('name').not().isEmpty().withMessage('Please enter category name')
                ]
            }
        case 'list':
            {
                return [
                    query('page').not().isEmpty().withMessage('page is required'),
                    query('limit').not().isEmpty().withMessage('limit is required')
                ]
            }
        case 'createProduct':
            {
                return [
                    check('name').not().isEmpty().withMessage('Please enter category name'),
                    check('price').not().isEmpty().withMessage('Please enter price'),
                    // check('description').not().isEmpty().withMessage('Please enter description'),
                    check('websiteUrl').not().isEmpty().withMessage('Please enter website url'),
                    check('categoryId').not().isEmpty().withMessage('Please select category')
                ]
            }
        case 'addWishlist':
            {
                return [
                    check('productId').not().isEmpty().withMessage('productId is required')
                ]
            }
        case 'removeWishlist':
            {
                return [
                    check('wishlistId').not().isEmpty().withMessage('wishlistId is required')
                ]
            }
        case 'createReportOptions':
            {
                return [
                    check('reports').not().isEmpty().withMessage('reports are required')
                ]
            }
        case 'report':
            {
                return [
                    check('reason').not().isEmpty().withMessage('Please select any reason to report'),
                    check('type').not().isEmpty().withMessage('type is required')
                ]
            }
        case 'deleteReport':
            {
                return [
                    check('reportId').not().isEmpty().withMessage('reportId is required')
                ]
            }
        case 'generatePhoneOTP':
            {
                return [
                    check('phone').not().isEmpty().withMessage('phone is required')
                ]
            }
        case 'validatePhoneOTP':
            {
                return [
                    check('phone').not().isEmpty().withMessage('phone is required'),
                    check('otp').not().isEmpty().withMessage('otp is required')
                ]
            }
        case 'addQuery':
            {
                return [
                    check('name').not().isEmpty().withMessage('name is required'),
                    check('message').not().isEmpty().withMessage('message is required')
                ]
            }
        case 'handleVisit':
            {
                return [
                    check('productId').not().isEmpty().withMessage('productId is required')
                ]
            }
        case 'lineGraph':
            {
                return [
                    check('startDate').not().isEmpty().withMessage('Start date is required'),
                    check('endDate').not().isEmpty().withMessage('End date is required')
                ]
            }
        case 'addCardToStripe':
            {
                return [
                    check('name').not().isEmpty().withMessage('name is required'),
                    check('email').not().isEmpty().withMessage('email is required'),
                    check('email').isEmail().withMessage('email is not valid'),
                    check('token').not().isEmpty().withMessage('token is required')
                ]
            }
    }
}