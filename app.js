const path = require("path");
require('dotenv').config()
const express = require('express')
require('./main');
const app = express()
const bodyParser = require('body-parser')
const port = 3082
const cors = require('cors');
const fs = require('fs')
fs.existsSync("uploads") || fs.mkdirSync("uploads");

const test = require('./routes/testRoutes');

const user = require('./routes/userRoutes');
const vendor = require('./routes/vendorRoutes');
const admin = require('./routes/adminRoutes');
const category = require('./routes/categoryRoutes');
const product = require('./routes/productRoutes');
const wishlist = require('./routes/wishlistRoutes');
const report = require('./routes/reportRoutes');
const query = require('./routes/queryRoutes');
const terms = require('./routes/termRoutes');

require('./util/cron-jobs');

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/v1/test', test);

app.use('/api/v1/user', user);
app.use('/api/v1/vendor', vendor);
app.use('/api/v1/admin', admin);
app.use('/api/v1/category', category);
app.use('/api/v1/product', product);
app.use('/api/v1/wishlist', wishlist);
app.use('/api/v1/report', report);
app.use('/api/v1/query', query);
app.use('/api/v1/static', terms);

app.listen(port, () => {
  console.log(`Fresh-Ideas app listening to port :${port}`)
})