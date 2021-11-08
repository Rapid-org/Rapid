const config = {};

config.web = {};

config.mongodb = {};

config.secerets = {};

config.secerets.firebaseAdminCredential = './rapid-client-firebase-adminsdk-ue1or-8e234b0005.json';

config.web.port = process.env.WEB_PORT || 9980;

config.mongodb.url = "mongodb://localhost/Rapid";

module.exports = config;