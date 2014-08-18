process.env.NODE_DEBUG = "debug";
//process.env.ONLINE = true;

var http = require("http");
var page = require('./bot/page');
var database = require('./bot/database');
var express = require('express');
var app = express();

var http = require("http");
var url = require("url");
var querystring = require("querystring");
var judgemode = require("./bot/judge");
var route = {
	"/judge" : judgemode.work
	};

function onRequest(req, res) {

	var purl = url.parse(req.url);
	var path = purl.pathname;

	if(route[path]) {
		route[path](req, res, querystring.parse(purl.query));
	}else{
		res.writeHead(404);
		res.end();
	}
}


var portServer = http.createServer(onRequest);
portServer.setTimeout(0);
portServer.listen(18081);

app.use(function(req,res,next) {
	req.receiveTime = new Date().getTime();
	next();
});
//app.use(express.compress());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.cookieSession({secret:'AIWEB', cookie: { maxAge: 60 * 60 * 1000 }}));
//app.use(express.logger());
/*app.use(function(req,res,next){
	res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
	res.setHeader('Expires', 0);
	res.setHeader('Pragma', 'no-cache');
	next();
});*/

app.use(app.router);
app.use(express.static(__dirname + '/bot/static'));
app.use(page.notfound);

function SW(str)
{
	return new RegExp("^" + str.replace('/','\\/') + "$","i");
}


app.get(SW('/'), page.index);
app.get(SW('/index'), page.index);
app.get(SW('/login'), page.login);
app.post(SW('/login'), page.logincheck);
app.get(SW('/logout'), page.logout);
app.get(SW('/register'), page.register);
app.post(SW('/register'), page.registercheck);
app.get(SW('/modifyuser'), page.modifyuser);
app.post(SW('/modifyuser'), page.modifyusercheck);
app.get(SW('/battle'), page.battle);
app.post(SW('/battle'), page.battlecheck);
app.get(SW('/userrank'), page.userrank);
app.get(SW('/AIrank'), page.AIrank);
app.get(SW('/status'), page.status);
app.get(SW('/userinfo'), page.userinfo);
app.get(SW('/AIinfo'), page.AIinfo);
app.get(SW('/submit'), page.submit);
app.post(SW('/submit'), page.submitcheck);
app.get(SW('/help'), page.help);
app.get(SW('/contest'), page.contest);
app.get(SW('/deleteAI'), page.deleteAI);
app.get(SW('/sourcecode'), page.sourcecode);
app.get(SW('/modifynotice'),page.modifynotice);
app.post(SW('/modifynotice'),page.modifynoticecheck);
//app.get(SW('/error'),page.error);
app.get(SW('/log'),page.log);
app.get(SW('/createcontest'),page.createcontest);
app.post(SW('/createcontest'),page.createcontestcheck);
app.get(SW('/contestinfo'),page.contestinfo);
app.post(SW('/contestinfo'),page.contestinfocheck);

database.init(function(){
	app.listen(18080);
	console.log("start");
});
