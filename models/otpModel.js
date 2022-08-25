var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var otpSchema = new Schema({
	'phone' : Number,
	'email' : String,
    'otp' : String,
}, {
    timestamps: true
});

module.exports = mongoose.model('otp', otpSchema);
