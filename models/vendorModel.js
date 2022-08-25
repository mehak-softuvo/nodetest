var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var vendorSchema = new Schema({
	'firstName' : String,
	'lastName' : String,
	'userName': String,
	'image' : String,
	'phone' : Number,
	'email': { type: String, lowercase: true },
    'password' : String,
	'isEmailVerified': {type: Boolean, default: false},
	'streetAddress1' : String,
	'streetAddress2' : String,
	'city' : String,
	'region' : String,
	'country' : String,
	'postalCode' : String,
	'shopName' : String,
	'shopImage' : String,
	'website' : String,
	'cardSource' : String,
	'customerId' : String,
	'token' : String,
	'status' : {type: Number, default: 1},
	'isApproved':{type:String,enum:['pending', 'approved', 'rejected'] ,default:'pending'}
}, {
    timestamps: true
});

module.exports = mongoose.model('vendor', vendorSchema);
