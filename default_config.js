try {
	var config = require('./config');
} catch(error) {
	var config = {};
}

var d = {};

//to override, define config.PORT in config.js - more info in README.md 
d.PORT = config.PORT || 9080;
d.client_id = config.client_id;
d.client_secret = config.client_secret;
d.EXTERNAL_LOGIN_URL = config.EXTERNAL_LOGIN_URL;
d.use_HTTPS = config.use_HTTPS || false;
d.mysql_pw = config.mysql_pw;
d.mysql_user = config.mysql_user;
d.mysql_host = config.mysql_host;
d.tls_cert_key = config.tls_cert_key;
d.tls_cert_crt = config.tls_cert_crt;
d.tls_cert_ca = config.tls_cert_ca;
d.mysql_database = config.mysql_database;
d.WEBSITE_URL = config.WEBSITE_URL;
d.WEBSITE_URL_COMPLETE = config.WEBSITE_URL_COMPLETE;
d.WEBSITE_REDIRECT = config.WEBSITE_REDIRECT;
d.isBehindProxy = config.isBehindProxy || false; //when true, the client's IP address is read from an header instead of connection details

module.exports = d;
