var express = require('express');
var request = require('request');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var source = req.query.source;
    if (!req.query.source) {
	res.send('{ "error" : "Missing source" }');
	return;
    }
    request.get('http://api.bart.gov/api/stn.aspx?cmd=stninfo&orig=' + source + '&key=ZDBP-5ZEE-9YKT-DWE9&json=y', function(error, response, body) {
	res.send(body);
    });
});

module.exports = router;
