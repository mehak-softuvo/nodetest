var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var categorySchema = new Schema({
	'name' : String,
    'image' : String,
	'status' : {type: Number, default: 1}
}, {
    timestamps: true
});

module.exports = mongoose.model('category', categorySchema);
