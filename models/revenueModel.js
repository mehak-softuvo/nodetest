var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var revenueSchema = new Schema({
    'vendorId' : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor'
    },
    'productId':{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product' 
    },
    'clicks':Number,
    'cost' : {type: String, default: "0"},
    'customerId' : String,
    'source' : String,
    'paymentdetail' : Object
}, {
    timestamps: true
});

module.exports = mongoose.model('revenue', revenueSchema);
