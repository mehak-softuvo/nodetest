var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	'firstName': String,
	'lastName': String,
	'username': String,
	'dob': Date,
	'image': String,
	'phone': Number,
	'email': { type: String, lowercase: true },
	'password': String,
	'isEmailVerified': { type: Boolean, default: false },
	'isAllCategoriesPreferred': { type: Boolean, default: false },
	'preferredCategories': Array,
	'productsViewed': Array,
	'token': String,
	'status': { type: Number, default: 1 }
}, {
	timestamps: true
});

module.exports = mongoose.model('user', userSchema);
