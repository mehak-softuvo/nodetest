var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var staticSchema = new Schema({
	'title' : String,
    'slug' : {
        type: String,
        default: 'report'
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('static', staticSchema);
