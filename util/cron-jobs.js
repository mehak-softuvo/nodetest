const { CronJob } = require('cron');
const Vendor = require('../models/vendorModel.js');
const Product = require('../models/productModel.js');
const Revenue = require('../models/revenueModel.js');
var config = require('config');
const stripeSecretKey = config.get('stripe').SECRET_KEY;

const stripe = require('stripe')(stripeSecretKey);

const perClickPrice = 0.41;

/**
 * Charge the vendor for the fresh clicks
 */
const chargeVendor = async () => {
    const vendors = await Vendor.find();
    for(const vendor of vendors) {
        if(vendor.customerId) {
            const clicksRecord = await Product.aggregate([
                { $match: { 
                    addedBy: vendor._id,
                    freshClickCount: {$gt: 0}
                }},
                {
                    $group : {
                        _id: "$$ROOT._id",
                       clicks: { $sum: "$freshClickCount"},
                       ids: { $push: "$$ROOT._id" }
                    }
                }
            ]);
            console.log("clickRecord",clicksRecord)
            if(clicksRecord && clicksRecord[0] && clicksRecord[0].clicks) {
                // Charge the Customer instead of the card:
                for(const clicks of clicksRecord){
                   const cost = ((clicks.clicks * perClickPrice).toFixed(2)) * 100
                    console.log(clicks,cost,vendor._id)
                    const charge =  await stripe.charges.create({
                        amount: cost,
                        currency: 'usd',
                        source: vendor.cardSource,
                        customer: vendor.customerId,
                        description: "Deduction for " + clicks.clicks + " clicks"
                    });
                    await Product.updateOne({ _id: clicks._id }, {$set: {freshClickCount: 0},$inc:{adDeductionCost:cost}})
                    await Revenue.create({
                        productId:clicks._id,
                        clicks:clicks.clicks ,
                        vendorId: vendor._id,
                        cost: cost/100,
                        customerId: vendor.customerId,
                        source: vendor.cardSource
                    })

                }
             
                // var mailOptions = {
                //     from: 'youremail@gmail.com',
                //     to: i.email,
                //     subject: `Discount for birthday`,
                //     text: "testing birthday Discount"
                // };
                // await sendMail(mailOptions)
            }
        }
    }
    return true;
};

const chargeVendorCron = new CronJob('* * * * *', async () => {
    console.log("Cron Triggered To Charge Vendor : ", new Date());
    await chargeVendor();
    return "Success";
});

chargeVendorCron.start();