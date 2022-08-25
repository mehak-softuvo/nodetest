var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var querySchema = new Schema({
	'name' : String,
    'email' : String,
    'phone' : Number,
    'message' : String
}, {
    timestamps: true
});

module.exports = mongoose.model('query', querySchema);
