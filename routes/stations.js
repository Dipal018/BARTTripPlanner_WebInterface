var express = require('express');
var request = require('request');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    request.get('http://api.bart.gov/api/stn.aspx?cmd=stns&key=ZDBP-5ZEE-9YKT-DWE9&json=y', function(error, response, body) {
	res.send(body);
    });
});

module.exports = router;
