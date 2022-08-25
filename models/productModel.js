var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
    'name': String,
    'mainImage': String,
    'images': Array,
    'currencySymbol': { type: String, default: '$' },
    'price': String,
    'searchName': String,
    // 'weight' : Number,
    // 'unitType' : String,
    'description': String,
    'categoryId': {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    'isAd': { type: Boolean, default: false },
    'totalClickCount': { type: Number, default: 0 },
    'freshClickCount': { type: Number, default: 0 },
    'addedBy': {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor'
    },
    'websiteUrl': String,
    'delete_status': { type: Boolean, default: false },
    'status': { type: Number, default: 1 },
    'adDeductionCost': Number  //This cost in cent you need to divied by 100 in frontend side
}, {
    timestamps: true
});

module.exports = mongoose.model('product', productSchema);
