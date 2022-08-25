var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var adminSchema = new Schema({
	'firstName' : String,
	'lastName' : String,
	'image' : String,
	'email' : String,
    'password' : String,
    'token' : String
}, {
    timestamps: true
});

module.exports = mongoose.model('admin', adminSchema);
