var mysql = require('mysql');
var util = require("util");
var Transform = require("stream").Transform;
util.inherits(ReqBuffer, Transform);
var format = util.format;
var database = require('./database');

if(process.env.NODE_DEBUG) {
	function date2str(x) {
		y="yyyy-MM-dd hh:mm:ss";
		var z ={y:x.getFullYear(),M:x.getMonth()+1,d:x.getDate(),h:x.getHours(),m:x.getMinutes(),s:x.getSeconds()};
		return y.replace(/(y+|M+|d+|h+|m+|s+)/g,function(v) {return ((v.length>1?"0":"")+eval('z.'+v.slice(-1))).slice(-(v.length>2?v.length:2))});
	}
	var log = function(){
		var str = date2str(new Date()) + ":";
		for(i=0;i<arguments.length;i++){
			//str += JSON.stringify(arguments[i]) + "\t";
			str += arguments[i] + "\t";
		}
		console.log(str);
	};
}else{
	var log = function(){};
}



function ReqBuffer() {
	if(!(this instanceof ReqBuffer))
		return new ReqBuffer();
		
	Transform.call(this);
	this._buffer = [];
}
ReqBuffer.prototype._transform = function(chunk, encoding, done) {
	var last = 0;
	for(var i = 0; i < chunk.length; i++) {
		if(chunk[i] == 10) {
			this._buffer.push(chunk.slice(last, i));
			this.push(Buffer.concat(this._buffer));
			this._buffer = [];
			last = i + 1;
		}
	}
	this._buffer.push(chunk.slice(last));
	done();
};

var soc,req;
var judgefunc;
function work(treq,tres) {
	tres.writeHead(200, {"Content-Type": "text/plain"});
	ai1=ai2=nid=null;

	function heartbeat()
	{
		if(soc){
			soc.write("\n");
			timer = setTimeout(heartbeat, 60000);
		}
	}
	timer = setTimeout(heartbeat, 60000);
	
	if(soc || req){
		log("judger relogin");
		soc.ondata = null;
		soc.onend = null;
		soc.removeAllListeners("close");
		soc.destroy();
		soc=req=null;
		judgefunc=null;
	}
	
	soc = tres.socket;
	soc.ondata = null;
	soc.onend = null;
	
	req = new ReqBuffer();
	soc.pipe(req);

	log("judger online");
	
	soc.removeAllListeners("close");
	soc.on("close",socketclose);
	soc.on("end",socketclose);
	function socketclose()
	{	
		if(!soc && !req) return;
		log("judger offline");
		soc=req=null;
		judgefunc=null;
		ai1=ai2=nid=null;
		if(timer){
			clearTimeout(timer);
			timer = null;
		}
	}
	req.on("data", function(content){
		if(content=="") return;
		//console.log(content.toString());
		try{
			content=JSON.parse(content);
		}catch(e){
			log("judge data corrupted");
			judgeNext();
			return;
		}
		
		log(format("receive result,NO:%d",content.id));
		if(content.id!=nid){
			log("judge No. wrong");
			soc.destroy();
			return;
		}
		content.log = new Buffer(content.log,"base64");
		database.judge(ai1,ai2,content,function(err){
			if(err){
				log("judge database error");
				soc.destroy();
				return;
			}
			ai1=ai2=nid=null;
			setTimeout(judgeNext, 2000);
		});
	});
	judgeNext();
	judgefunc = judgeNext;
	function judgeNext(){
		if(nid) return;
		database.getJudgeContent(function(content){
			if(!soc) return;
			if(content instanceof Error){
				log("judge database error");
				soc.destroy();
				return;
			}
			if(typeof(content)=='undefined') return;
			ai1=content.Aid;
			ai2=content.Bid;
			nid=content.id;
			delete content.Aid;
			delete content.Bid;
			log(format("sending sourcecode,NO:%d",content.id));
			clearTimeout(timer);
			timer = null;
			soc.write(JSON.stringify(content)+'\n','utf8',function(){
				log(format("sourcecode sended,NO:%d",content.id));
				timer = setTimeout(heartbeat, 60000);
			});
		});
	}
}
function judge()
{
	if(judgefunc)
		judgefunc();
}
function queryStatus()
{	
	if(judgefunc)
		return true;
	return false;
}
exports.work=work;
exports.judge=judge;
exports.queryStatus=queryStatus;
