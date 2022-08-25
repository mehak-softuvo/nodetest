var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var reportSchema = new Schema({
    'addedBy': {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    'productId': {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    'vendorId': {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor'
    },
    'productName': {
        type: String
    },
    'userName': {
        type: String
    },
    'websiteUrl': {
        type: String
    },
    'bussinessName': {
        type: String
    },
    'type': String,
    'reason': String,
}, {
    timestamps: true
});

module.exports = mongoose.model('report', reportSchema);
