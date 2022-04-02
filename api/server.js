require('./models/usersModel');
require('./models/projectsModel');
const config = require('./config');
const cors = require('cors');
const express = require('express'),
    app = express(),
    fs = require('fs'),
    port = config.web.port,
    mongoose = require('mongoose'),
    bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require("./rapid-client-firebase-adminsdk-ue1or-8e234b0005.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
mongoose.Promise = global.Promise;
mongoose.connect(config.mongodb.url).then(() => {
});
const db = mongoose.connection;
var archiver = require('archiver');

db.on('error', console.error.bind(console, 'Connection Error:'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var options = {
    inflate: true,
    limit: '100kb',
    type: '*/*'
  };
app.use(bodyParser.raw(options));
app.use(cors());
  
const routes = require('./serverRoutes');
routes(app);

db.once('open', () => {
    app.listen(port, () => {
        console.log(`Rapid server running on port ${config.web.port}`);
    });

    /*const Projects = db.collection('projects');
    const changeStream = Projects.watch();

    changeStream.on('change', (change) => {
        console.log(change);
    });*/
});