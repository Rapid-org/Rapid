const config = {};

config.web = {};

config.mongodb = {};

config.web.port = process.env.WEB_PORT || 9980;

config.mongodb.url = "mongodb://localhost/MongoDB";

module.exports = config;