require('./models/usersModel');
require('./models/projectsModel');
const config = require('./config');
const cors = require('cors');
const express = require('express'),
    app = express(),
    port = config.web.port,
    mongoose = require('mongoose'),
    bodyParser = require('body-parser');
mongoose.Promise = global.Promise;
mongoose.connect(config.mongodb.url).then(() => {

});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
const routes = require('./serverRoutes'); //importing route
routes(app);

app.listen(port);

console.log('Rapid API server started on: ' + port);