var express = require("express");
// var googleApiCall = require('./googleApiCall')
var app = express(); //to use express
app.use(express.static('public'));

var router = express.Router();
var path = __dirname + '/views/';
var http = require('http');
var request = require('request');
var fs = require('fs');
var folderName = __dirname + '/userData';
var maxResults = '20';
var startTime = (new Date()).toISOString();

function doesPathExist(path,type, callback){
	try {
		var stats = fs.statSync(path);
		return true;
	} catch(err) {
		return false;
	}
	return false;
}

class AllCachedUsersAndReminders{
	constructor(){
		this.cacheObject = {};
	}
	setElement(userEmail, CacheForReminder){
		this.cacheObject[userEmail] = CacheForReminder;
		var fileName = folderName+"/"+userEmail+".txt";
		if(!doesPathExist(folderName,'Directory')){
			fs.mkdirSync(folderName);			
		}
		fs.appendFileSync(fileName, JSON.stringify(CacheForReminder));
	}

	getElement(userEmail) {
		var fileName = folderName+"/"+userEmail+".txt";
		try{
			var contents = JSON.parse(fs.readFileSync(fileName));
			return [contents, undefined];
		} catch(err) {
			console.log("err: " + err);
			return [undefined, err];
		}
	};
}

const allremindersOnServer = new AllCachedUsersAndReminders();
var options = {
  url: 'https://content.googleapis.com/calendar/v3/calendars/primary/events?maxResults='+maxResults+'&orderBy='+'startTime'+'&showDeleted=false&singleEvents=true&timeMin='+startTime,
};
function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    response.send('info',info);
    // CALL CLIENT PAGE WITH DATA
  }else{
  	console.log(" ERROR!!"+error);
  }
}

router.use(function (req,res,next) {
  console.log("/" + req.method);
  next();
});

/********* AKP *************/
class Attendee{
	constructor(attendeeVal){
	  this.displayName = attendeeVal.displayName;
	  this.responseStatus = attendeeVal.responseStatus;
	  this.emailId = attendeeVal.email;
	}
}
/********* AKP *************/
class Reminder{
	constructor(event){
	  this.title = event.summary;
	  this.description = event.description;
	  this.when = event.start.dateTime;
	  this.attendees = event.attendees;
	  
	  if(this.attendees!=null){
	    var cntr = 0;
	    var attendeeList = this.attendees;
	    this.listofAtendees = new Array(attendeeList.length);
	    for(var j=0; j<attendeeList.length; j++){
	            const attendeeItem = new Attendee(this.attendees[j]);
	            this.listofAtendees[cntr] = attendeeItem;
	            cntr++;
	        } 
	  }
	}
}
/********* AKP *************/
class CacheForReminder{
	constructor(emailId, authenticationKey, listOfReminders){
	  this.emailId = emailId;
	  this.authenticationKey = authenticationKey;
	  this.listOfReminders = listOfReminders;
	  this.createdAt = (new Date()).toISOString();
	}
}

router.get('/get_events', function(req,res){
	var authorization = req.query.authorized;
	var authEmail = req.query.email;
	authorization = 'Bearer '+authorization;
	options.headers = {'Authorization':authorization};
	//chk if cache exists then don't ping google
	var remindersResponse = allremindersOnServer.getElement(authEmail);
	if(remindersResponse[1] == undefined){
		res.send(remindersResponse[0]);
	}else{
		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
			    var info = JSON.parse(body);
	            var events = info.items;
	            if (events.length > 0) {
	              arrayOfReminders = new Array(events.length);
	              for (i = 0; i < events.length; i++) {
	                var event = events[i];
	                const eventDetails = new Reminder(event);
	                arrayOfReminders[i] = eventDetails;
	              }
	            } else {
	              arrayOfReminders = new Array(0);
	            }
	            const cacheObjectForReminder = new CacheForReminder(authEmail, authorization, arrayOfReminders);
	            allremindersOnServer.setElement(authEmail, cacheObjectForReminder);
			    var remindersResponse = allremindersOnServer.getElement(authEmail);
			    if (remindersResponse[1] == undefined) {
			    	res.send(remindersResponse[0]);
			    }
			  }else{
			  	console.log(" ERROR!!"+error);
			  }
		});		
	}
});
/**********************/
router.get('/get_events_backup', function(req,res){
	var authorization = req.query.authorized;
	authorization = 'Bearer '+authorization;
	options.headers = {'Authorization':authorization};
	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
		    var info = JSON.parse(body);
		    res.status(response.statusCode).send(body);
		    // CALL CLIENT PAGE WITH DATA
		  }else{
		  	console.log(" ERROR!!"+error);
		  }
	});
});
router.get("/",function(req,res){
  res.sendFile(path + "index.html");
});
router.get("/quickstart",function(req,res){
  res.sendFile(path + "quickstart.html");
});
app.use("/",router);
router.get("/about",function(req,res){
  res.sendFile(path + "about.html");
});
router.get("/contact",function(req,res){
  res.sendFile(path + "contact.html");
});
app.use("*",function(req,res){
  res.sendFile(path + "404.html");
});
app.listen(3007,function(){
  console.log("Live at Port 3007");
});