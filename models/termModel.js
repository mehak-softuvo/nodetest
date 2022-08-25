var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var termSchema = new Schema({
	'header': String,
	'title': String,
	'image': String,
	'body': String,
    'slug':String
	
}, {
	timestamps: true
});

module.exports = mongoose.model('term', termSchema);
