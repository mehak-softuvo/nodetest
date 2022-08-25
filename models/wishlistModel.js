var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var wishlistSchema = new Schema({
	'userId' : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    'productId' : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('wishlist', wishlistSchema);
