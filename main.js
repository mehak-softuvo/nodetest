const mongoose = require('mongoose');
const config = require('config');
//mongoose.connect('mongodb://localhost/boohoonew', {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false});
mongoose.connect('mongodb://localhost:27018/boohoo', {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('we are connected!')
});