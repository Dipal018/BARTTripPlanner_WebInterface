var express = require('express');
var request = require('request');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var source = req.query.source;
    var dest = req.query.dest;
    if (!source || !dest) {
	res.send('{ "error" : "Missing source or destination query param" }');
	return;
    }
    request.get('http://api.bart.gov/api/etd.aspx?cmd=etd&orig=' + source + '&key=ZDBP-5ZEE-9YKT-DWE9&json=y', function(etdError, etdResponse, etdBody) {
        if (etdError || etdResponse.statusCode != 200) {
	    res.send('{ "error": "Could not get realtime information for origin station" }');
	    return;
	}
	var sourceRealTimeInfoJson = JSON.parse(etdBody).root.station[0].etd;
	request.get('http://api.bart.gov/api/sched.aspx?cmd=depart&orig=' + source + '&dest=' + dest + '&key=ZDBP-5ZEE-9YKT-DWE9&json=y&b=0&a=4', function(error, response, body) {
	    if (error || response.statusCode != 200) {
		res.send('{ "error": "Could not find a route" }');
	    }
	    var bodyJson = JSON.parse(body);
	    var trips = bodyJson.root.schedule.request.trip;
	    var responseObj = {}
	    var currentTime = new Date();
	    currentTime.setSeconds(0,0);
	    var nextTrain = {};
	    var nextTrainAfterMinutes = -1;
	    responseObj.orig = source;
	    responseObj.dest = dest;
	    responseObj.trains = [];
	    
	    for (i = 0; i < trips.length; i++) {
		var train = {}
		train.legs = trips[i].leg.map(l => l["@origin"]);
		train.legs.push(trips[trips.length-1]["@destination"]);
		train.scheduledDepartureTimeMin = trips[i]["@origTimeMin"];
		train.scheduledArrivalTime = trips[i]["@destTimeMin"];
		train.fare = trips[i]["@fare"];
		var firstLeg = trips[i].leg[0];
		var firstLegHeadStation = firstLeg["@trainHeadStation"];

		// find realtime status of station "source" and look for trains towards "firstLegHeadStation"
		var nextTrainsEtdForFirstLegHeadStation = sourceRealTimeInfoJson.find(train => train.abbreviation == firstLegHeadStation);
                if (nextTrainsEtdForFirstLegHeadStation.estimate[0].minutes == "Leaving") {
		    nextTrainsEtdForFirstLegHeadStation.estimate[0].minutes = 0;
		}
		var nextTrainAfterMinutesForHeadStation = nextTrainsEtdForFirstLegHeadStation.estimate[0].minutes;
		if (nextTrainAfterMinutes == -1 || nextTrainAfterMinutesForHeadStation < nextTrainAfterMinutes) {
		    nextTrainAfterMinutes = nextTrainAfterMinutesForHeadStation;
		    nextTrain = train;
		}
		responseObj.trains.push(train);
	    }
	    responseObj.nextDepartingTrain = nextTrain;
	    var nextTrainAt = new Date(currentTime.getTime() + nextTrainAfterMinutes * 60000);
	    nextTrainAt.setSeconds(0,0);
	    responseObj.nextDepartingTrainAt = nextTrainAt.toISOString(); 
	    res.send(responseObj);
	});
    });
});

module.exports = router;
