var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var clickSchema = new Schema({
    'productId' : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    'vendorId' : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor'
    },
	'clickedBy' : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('click', clickSchema);
