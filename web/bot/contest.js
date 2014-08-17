var mysql = require('mysql');
var util = require("util");
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
	var replace = function(str,from,to)
	{
		if(from.length!=to.length){
			console.log("replace不匹配")
			throw(new Error("replace不匹配"));
		}
		var i;
		for(i=0;i<from.length;i++){
			str = str.replace(from[i],to[i]);
		}
		return str;
	};
}else{
	var log = function(){};
	var replace = function(str,from,to)
	{
		var i;
		for(i=0;i<from.length;i++){
			str = str.replace(from[i],to[i]);
		}
		return str;
	};
}

function Ccontest(id,name,time,ai,result,_log)
{
	if(!(this instanceof Ccontest))
		return new Ccontest(id,name,time,ai,result,_log);

	delete this.log;
	delete this.allturn;
	delete this.nowturn;
	delete this.aimap;
	
	this.id = id;
	this.ai = ai;
	this.result = result;
	this._name = name;
	this.time = time;
	if(this.result==-2) this.log = _log;
	if(this.result == -1 || this.result == -2){
		var now = new Date();
		var thisContest = this;
		var timeleft;
		
		function contestAlarm()
		{
			timeleft = time.getTime() - now.getTime();
			if(timeleft>2147483647){
				setTimeout(contestAlarm,2147483647);
			}else{
				setTimeout(function(){
					thisContest.contestStart();
				},timeleft);
			}
		}
		contestAlarm();
		return;
	}

	this.log = _log;
	
	if(this.result == 1) return;

	if(ai.length == 0){
		this.allFinish();
		return;
	}
	
	if(ai.length % 2 == 1){
		console.log("contest ai num err");
		return;
	}
	
	var i,tmp;
	for(i=0,tmp=1;tmp<ai.length;i++,tmp*=2);
	this.allturn = Math.min(ai.length - 1,i * 2 - 1);
	
	var aimap = this.aimap = {};
	
	for(i=0;i<ai.length;i++){
		ai[i].num = 0;
		aimap["U"+database.getAIUser(ai[i].id)]=ai[i];
	}
	
	for(i=0;i<this.log.length;i++){
		aimap["U"+database.getAIUser(this.log[i].ai1)].num++;
		aimap["U"+database.getAIUser(this.log[i].ai2)].num++;
	}
	
	this.nowturn = ai[0].num;
	for(i=1;i<ai.length;i++){
		this.nowturn = Math.min(this.nowturn,ai[i].num);
	}
	//if(this.nowturn!=0 && this.log.length == this.nowturn * ai.length / 2){
	//	this.nowturn--;
	//}

	var thisContest = this;
	function judgeLoop(){
		var j=thisContest.getNextJudge();
		if(typeof(j)=="undefined") return;
		database.makebattle(j[0].id,j[1].id,function(id,result){
			if(result>=3) result-=3;
			if(result==0){
				j[0].score++;
				j[1].score++;
			}else if(result==1){
				j[0].score+=3;
			}else{
				j[1].score+=3;
			}
			j[0].num++;
			j[1].num++;
			thisContest.log.push({id:id,result:result,ai1:j[0].id,ai2:j[1].id});
			
			database.saveContest(thisContest,function(err){
				if(err){
					log("judgeLoop",err);
				}
				setTimeout(judgeLoop,2000);
			});
		});
	}
	judgeLoop();
}

Ccontest.prototype.getNextJudge = function()
{
	if(this.result != 0){
		log("contest getNextJudge error");
		return;
	}

	var i,j,s1,s2;
	ai = this.ai;
	for(i=0;i<ai.length;i++) if(ai[i].num == this.nowturn){
		s1 = i;
		break;
	}
	if(typeof(s1)=="undefined"){
		return this.roundFinish();
	}


	for(i++;i<ai.length;i++) if(ai[i].num == this.nowturn){
		s2 = i;
		for(j=0;j<this.log.length;j++){
			var user1=database.getAIUser(this.log[j].ai1);
			var user2=database.getAIUser(this.log[j].ai2);
			if((user1==database.getAIUser(ai[s1].id) && user2==database.getAIUser(ai[i].id)) || 
				(user1==database.getAIUser(ai[i].id) && user2==database.getAIUser(ai[s1].id))){
				s2 = null;
				break;
			}
			
		}
		if(s2 != null) break;
	}
	if(s2 == null){
		for(i=s1+1;i<ai.length;i++) if(ai[i].num==this.nowturn){
			s2=i;
			break;
		}
	}
	return [ai[s1],ai[s2]];	
}

Ccontest.prototype.roundFinish = function()
{	
	log("contest round finish",this.id);
	var ai,i;
	ai = this.ai;
	for(i=0;i<ai.length;i++) ai[i].OPscore = 0;
	for(i=0;i<this.log.length;i++) {
		var ai1=this.aimap["U" + database.getAIUser(this.log[i].ai1)];
		var ai2=this.aimap["U" + database.getAIUser(this.log[i].ai2)];
		ai1.OPscore += ai2.score;
		ai2.OPscore += ai1.score;
	}
	this.ai.sort(function(a,b){
		if(a.score != b.score){
			return b.score-a.score;
		}else{
			return b.OPscore-a.OPscore;
		}
	});


	this.nowturn ++;
	
	if(this.nowturn == this.allturn){
		 this.allFinish();
		 return;
	}	

	if(this.id==3){
		Ccontest.call(this,this.id,this._name,new Date(this.time.getTime() + 24*60*1000*60),this.ai,-2,this.log);
	}else{
		Ccontest.call(this,this.id,this._name,new Date(this.time.getTime() + 10*1000*60),this.ai,-2,this.log);
	}		
	this.saveContestloop();
	return;
}

Ccontest.prototype.allFinish = function()
{
	log("contestEnd",this.id);
	var ai,i;
	ai=this.ai;
	for(i=0;i<ai.length;i++){
		delete ai[i].num;
	}
	Ccontest.call(this,this.id,this._name,this.time,this.ai,1,this.log);
	this.saveContestloop();
	return;
}

Ccontest.prototype.saveContestloop = function()
{
	var thisContest = this;
	database.saveContest(thisContest,function(err){
		if(err){
			log("saveContestloop",err);
			setTimeout(thisContest.saveContestloop,5000);
		}
	});
}

Ccontest.prototype.contestStart = function()
{
	if(this.result==-2){
		log("contestREStart",this.id);
		Ccontest.call(this,this.id,this._name,this.time,this.ai,0,this.log);
		return;
	}
	
	if(this.ai.length % 2 == 1){
		this.ai.push({id:228});
	}
	for(var i=0;i<this.ai.length;i++){
		this.ai[i].score = 0;
	}
	log("contestStart",this.id);
	Ccontest.call(this,this.id,this._name,this.time,this.ai,0,[]);
}

exports.Ccontest = Ccontest;
