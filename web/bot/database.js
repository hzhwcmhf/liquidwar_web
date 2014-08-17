var mysql = require('mysql');
var util = require("util");
var judgemode = require("./judge");
var events = require("events");
var Ccontest = require("./contest");


function date2str(x) {
	y="yyyy-MM-dd hh:mm:ss";
	var z ={y:x.getFullYear(),M:x.getMonth()+1,d:x.getDate(),h:x.getHours(),m:x.getMinutes(),s:x.getSeconds()};
    return y.replace(/(y+|M+|d+|h+|m+|s+)/g,function(v) {return ((v.length>1?"0":"")+eval('z.'+v.slice(-1))).slice(-(v.length>2?v.length:2))});
}

if(process.env.NODE_DEBUG) {
	var username = 'botadmin';
	var password = 'botpassword';
	var db_host = 'localhost';
	var db_port = '3306';
	var db_name = 'bot';
	var log = function(){
		var str = "";
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
if(process.env.ONLINE) {
	//填写数据库连接信息，可查询数据库详情页
	var username = 'Pwpuxm1RUCwNsRqcgtd6opGy';//API KEY
	var password = '4GwH5wGKT7iGu1m3C0sPMqiPi4ERXYvx';//Secret KEY
	var db_host = 'sqld.duapp.com';
	var db_port = 4050;
	var db_name = 'PFSJkkjBymliqMtcSOEo';
}

var option = {
  host: db_host,
  port: db_port,
  user: username,
  password: password,
  database: db_name,
  multipleStatements: true
}

var userNamelist;
var publicAI; //按用户名-ai名排列
var userranklist;
var AIranklist;
var userIDlist;
var AIIDlist;
var contestArr;

function connect()
{
	var client = mysql.createConnection(option);
	client.mquery = function() 
	{
		var i=0;
		var results=[];
		var arg = arguments;
		//console.log(arg[i]);
		client.query(arg[i],function rec(err,tmp){
			if(err){
				arg[arg.length-1](err);
				return;
			}
			results.push(tmp);
			i++;
			if(i==arg.length-1){
				arg[arg.length-1](err,results);
			}else{
				if(arg[i]!="")
					client.query(arg[i],rec);
				else
					rec();
			}
		});
	};
	client.connect(function(err){
		if (err) {
			log("connect error",err);
			return;
		}
	});
	
	client.on('error',function(err) {
		if (err.errno != 'ECONNRESET') {
			throw err;
		}
	});
	
	return client;
}

function sortArr(fn){
	this.fn = fn;
}
sortArr.prototype=new Array();
sortArr.prototype.pushUntil = function(a){
	var i;
	this.push(a);
	for(i=this.length-1;i>0;i--){
		if(this.fn(this[i-1],a)>0)
			this[i]=this[i-1];
		else break;
	}
	this[i]=a;
}
sortArr.prototype.find = function(a){
	/*var l=0,r=this.length-1;
	while(l+1<mid){
		var mid=Math.floor((l+r)/2);
		if(this.fn(this[mid],a)<0){
			l=mid;
		}else{
			r=mid;
		}
	}*/
	for(i=0;i<this.length;i++){
		if(this[i]===a) return i;
	}
}
Array.prototype.erase = function(a){
	var i,tmp=this.pop(),t2;
	for(i=this.length-1;i>0;i--){
		if(tmp!==a){
			t2=this[i];
			this[i]=tmp;
			tmp=t2;
		}else break;
	}
}
sortArr.prototype.sort = function(){
	Array.prototype.sort.call(this,this.fn);
}
sortArr.prototype.adjust = function(pos,callback)
{
	var i;
	//console.log(this[pos-1]);
	if(pos!=0 && this.fn(this[pos-1],this[pos])>0){
		var tmp=this[pos];
		for(i=pos-1;i>=0;i--){
			if(this.fn(this[i],tmp)>0){
				this[i+1]=this[i];
				callback(this[i+1],i+1);
			}else break;
		}
		this[i+1]=tmp;
		callback(this[i+1],i+1);
	}else if(pos!=this.length-1 && this.fn(this[pos],this[pos+1])>0){
		var tmp=this[pos];
		for(i=pos+1;i<this.length;i++){
			if(this.fn(tmp,this[i])>0){
				this[i-1]=this[i];
				callback(this[i-1],i-1);
			}else break;
		}
		this[i-1]=tmp;
		callback(this[i-1],i-1);
	}
}
function init(callback)
{
	var client = connect();
	client.mquery("SELECT id,username,email,time,motto from user", 
		"SELECT id,AIname,userid,type,time from ai",
		"SELECT Aid,Bid,win,sum,result FROM status where result!=-1 and result<3 and Aid!=Bid",
		"SELECT id,name,ai,time,log,result FROM contest ORDER BY id DESC",
		function(err,results) {
			if(err){
				log('init',err);
				client.end();
				callback(err);
				return;
			}
			var user = results[0];
			var ai = results[1];
			var status = results[2];
			var contest = results[3];
			
				var i;
				
				userNamelist={};
				userIDlist=[];
				user.__proto__=sortArr.prototype;
				user.fn = function(a,b){return b.score-a.score};
				userranklist = user;
				for(i=0;i<user.length;i++){
					userNamelist["USER_" + user[i].username] = user[i];
					userIDlist[user[i].id] = user[i];
					user[i].publicAI=[];
					//user[i].allAInum=0;
					user[i].allAI=[];
					user[i].score=0;
					user[i].allStatusNum=user[i].winStatusNum=0;
					user[i].allOPnum=user[i].winOPnum=0;
				}

				AIIDlist=[];
				publicAI=new sortArr(function(a,b){
					var q=a.user.username+"-"+a.AIname,w=b.user.username+"-"+b.AIname;
					if(q<w){
						return -1;
					}else if(q>w){
						return 1;
					}else{
						return 0;
					}
				});
				ai.__proto__=sortArr.prototype;
				ai.fn = function(a,b){return b.score-a.score};
				AIranklist= ai;
				for(i=0;i<ai.length;i++){
					AIIDlist[ai[i].id] = ai[i];
					ai[i].allStatusNum=0;
					ai[i].winStatusNum=0;
					ai[i].allOPnum=0;
					ai[i].winOPnum=0;
					ai[i].user=userIDlist[ai[i].userid];
					//ai[i].user.allAInum++;
					if(ai[i].type==1){
						publicAI.push(ai[i]);
					}
					ai[i].user.allAI.push(ai[i]);
				}

				for(i=0;i<status.length;i++){
					var AIA = AIIDlist[status[i].Aid],AIB=AIIDlist[status[i].Bid];
					AIA.allStatusNum+=1;
					AIB.allStatusNum+=1;
					if(status[i].result==1){
						AIA.winStatusNum+=1;
					}else if(status[i].result==2){
						AIB.winStatusNum+=1;
					}else{
						AIA.winStatusNum+=0.5;
						AIB.winStatusNum+=0.5;
					}
					if(status[i].sum>0){
						AIA.allOPnum+=1;
						AIB.allOPnum+=1;
						AIA.winOPnum+=status[i].win / 2 /status[i].sum;
						AIB.winOPnum+=1-status[i].win / 2 /status[i].sum;
					}
				}
				for(i=0;i<ai.length;i++){
					/*if(ai[i].winOPnum==0)
						ai[i].score=0;
					else
						ai[i].score=ai[i].winOPnum/ai[i].allOPnum;*/
					ai[i].user.allStatusNum += ai[i].allStatusNum;
					ai[i].user.winStatusNum += ai[i].winStatusNum;
					ai[i].user.allOPnum += ai[i].allOPnum;
					ai[i].user.winOPnum += ai[i].winOPnum;
					//ai[i].user.score = Math.max(ai[i].user.score,ai[i].score);
				}
				/*user.sort();
				ai.sort();
				for(i=0;i<ai.length;i++){
					ai[i].rank=i+1;
					if(ai[i].type==1){
						ai[i].user.publicAI.push(ai[i]);
					}
				}
				for(i=0;i<user.length;i++){
					user[i].rank=i+1;
				}*/
				publicAI.sort();


				contestArr = [];
				for(i=0;i<contest.length;i++){
					contestArr.push(loadContest(contest[i]));
				}
				
				refresh();
				callback();
	});
}

function refresh()
{
	var client=connect();
	client.query("SELECT Aid,Bid,win,sum FROM status where result!=-1 and sum!=0",function(err,status){
		client.end();
		if(err){
			log('refresh',err);
			setTimeout(refresh,60000);
			return;
		}
		var ai = AIranklist, user = userranklist;
		/*for(i=1;i<status.length;i++){
			var tmp = status[i],pos = Math.floor(Math.random() * i);
			status[i] = status[pos];
			status[pos] = tmp;
		}*/
		for(i=0;i<user.length;i++){
			user[i].score = 0;
			user[i].publicAI = [];
		}
		for(i=0;i<ai.length;i++)
			ai[i].score = 0;
		for(i=0;i<status.length;i++){
			var AIA = AIIDlist[status[i].Aid],AIB=AIIDlist[status[i].Bid];
			if(AIA.user === AIB.user) continue;
			if(AIA.score == 0) AIA.score = 1500;
			if(AIB.score == 0) AIB.score = 1500;
			var sum = AIA.score * 0.05 + AIB.score * 0.05;
			var ascore = sum * status[i].win / 2 / status[i].sum;
			AIA.score = AIA.score * 0.95 + ascore;
			AIB.score = AIB.score * 0.95 + sum - ascore;
		}
		
		ai.sort();
		for(i=0;i<ai.length;i++){
			ai[i].rank=i+1;
			if(ai[i].type==1){
				ai[i].user.publicAI.push(ai[i]);
			}
			ai[i].user.score = Math.max(ai[i].user.score,ai[i].score);
		}
		user.sort();
		for(i=0;i<user.length;i++){
			user[i].rank=i+1;
		}
		setTimeout(refresh,60000);
	});
}

function checkuser(username,password,callback)
{
	if(typeof(userNamelist["USER_" + username])=="undefined"){
		callback(-1);
		return;
	}
	var client=connect();
	client.query("SELECT password from user where id='" + userNamelist["USER_" + username].id + "'",
		function(err,rows) {
			client.end();
			if(err){
				log('checkuser',err);
				callback(err);
				return;
			}
			if(rows.length==0){
				log('checkuser',"不匹配错误000");
				callback(new Error("该用户不存在"));
				return;
			}
			if(rows[0].password!=password){
				callback(-1);
			}else{
				callback(userNamelist["USER_" + username].id);
			}
		}
	);
}
function register(username,password,email,motto,callback)
{
	if(typeof(userNamelist["USER_" + username])!="undefined"){
		callback(-1);
		return;
	}else{
		var client=connect();
		client.mquery(replace('INSERT INTO user (username,password,email,motto) VALUES ("%USERNAME","%PASSWORD","%EMAIL","%MOTTO");',
					["%USERNAME","%PASSWORD","%EMAIL","%MOTTO"],
					[username,password,email,motto]),
					'SELECT id,username,email,time,motto from user WHERE id=LAST_INSERT_ID()',
			function(err,results) {
				client.end();
				if(err){
					log('register',err);
					callback(err);
					return;
				}
				var user=results[1][0];
				/*user.allAInum=*/user.allStatusNum=user.winStatusNum=user.allOPnum=user.winOPnum=0;
				user.score=0;
				user.publicAI=[];
				user.allAI=[];
				userIDlist[user.id]=user;
				userNamelist["USER_"+user.username]=user;
				userranklist.push(user);
				user.rank=userranklist.length;
				callback();
			}
		);
	}
}
function updateuser(userid,password,email,motto,callback)
{
	var client=connect();
	client.query(replace("UPDATE user SET password='%PASSWORD',email='%EMAIL',motto='%MOTTO' WHERE id=%USERID",
				["%PASSWORD","%EMAIL","%MOTTO","%USERID"],[password,email,motto,userid]),
		function(err){
			client.end();
			if(err){
				log('updateuser',err);
				callback(err);
				return;
			}
			var user=userIDlist[userid];
			user.email=email,user.motto=motto;
			callback();
		}
	);
}
function submitAI(userid,AIname,type,language,sourcecode,callback)
{
	var client=connect();
	client.mquery(mysql.format(
		replace("INSERT INTO ai (userid,AIname,type,language,sourcecode) VALUES ('%USERID','%AINAME','%TYPE','%LANGUAGE',?);",
			["%USERID","%AINAME","%TYPE","%LANGUAGE"],[userid,AIname,type,language]),sourcecode),
			"SELECT id,AIname,userid,type,time from ai WHERE id=LAST_INSERT_ID()",
		function(err,results){
			client.end();
			if(err){
				log("submitAI",err);
				callback(err);
				return;
			}
			var ai = results[1][0];
			ai.user = userIDlist[userid];
			//ai.user.allAInum++;
			ai.rank=AIranklist.length;
			AIranklist.push(ai);
			AIIDlist[ai.id]=ai;
			ai.score=0;
			ai.allStatusNum=ai.winStatusNum=ai.allOPnum=ai.winOPnum=0;
			ai.user.allAI.push(ai);
			if(type==1){
				publicAI.pushUntil(ai);
				ai.user.publicAI.push(ai);
			}
			callback();
		}
	);
}
function deleteAI(id,callback)
{
	var client=connect();
	client.query("UPDATE ai SET type=3 WHERE id=" + id,function(err)
	{
		client.end();
		if(err){
			log("deleteAI",err);
			callback(err);
			return;
		}
		var ai=AIIDlist[id];
		if(ai.type==1){
			publicAI.erase(ai);	
			ai.user.publicAI.erase(ai);
		}
		ai.type=3;
		callback();
	});
}
function getSourcecode(id,callback)
{
	var client=connect();
	client.query("SELECT language,sourcecode FROM ai WHERE id=" + id,function(err,results)
	{
		client.end();
		if(err){
			log("getSourcecode",err);
			callback(err);
			return;
		}
		callback(results[0].language,results[0].sourcecode);
	});
}
function battle(id1,id2,callback)
{
	var client=connect();
	client.query(replace("INSERT INTO status (Aid,Bid,result,resultInfo) values ('%ID1','%ID2',-1,'<td colspan=2><font color=grey>Pending<font>')",["%ID1","%ID2"],[id1,id2]),
		function(err,results){
			client.end();
			if(err){
				log("battle",err);
				callback(err);
				return;
			}
			setTimeout(judgemode.judge, 2000);
			callback();
		}
	);
}
function getStatus(down,top,ai1,ai2,callback)
{
	var client=connect();
	var limit = "";
	if(ai1!=0){
		if(ai2!=0){
			limit = "((Aid=" + ai1 + " AND Bid=" + ai2 + ") OR (Aid=" + ai2 + " AND Bid=" + ai1 + "))";
		}else{
			limit = "(Aid=" + ai1 + " OR Bid=" + ai1 + ")";
		}
	}else{
		if(ai2!=0){
			limit = "(Aid=" + ai2 + " OR Bid=" + ai2 + ")";
		}
	}

	if(down==-1){
		if(top==-1){
			if(limit==""){
				var query = "SELECT id,Aid,Bid,result,resultInfo,time FROM status ORDER BY id DESC LIMIT 21";				
			}else{
				var query = "SELECT id,Aid,Bid,result,resultInfo,time FROM status WHERE " + limit + " ORDER BY id DESC LIMIT 21";
			}
		}else{
			if(limit!="")limit +=" AND ";
			var query = "SELECT id,Aid,Bid,result,resultInfo,time FROM status WHERE " + limit + "id<" + top + " ORDER BY id DESC LIMIT 21";
		}
		client.query(query,function(err,results){
			client.end();
			if(err){
				log("getStatus",err);
				callback(err);
				return;
			}
			callback(results);
		});
	}else{
		if(limit!="")limit +=" AND ";
		client.query("SELECT id,Aid,Bid,result,resultInfo,time FROM status WHERE " + limit + "id>=" + down + " ORDER BY id LIMIT 21",function(err,results){
			client.end();
			if(err){
				log("getStatus",err);
				callback(err);
				return;
			}
			results.reverse();
			callback(results);
		});
	}
}
function getJudgeContent(callback)
{
	var client=connect();
	client.query("select status.id,Aid,Bid,a.sourcecode as source1,a.language as language1,b.sourcecode as source2,b.language as language2 from status join ai as a on status.Aid=a.id join ai as b on status.Bid=b.id where result=-1 limit 1",function(err,results){
		client.end();
		if(err){
			log("getStatus",err);
			callback(err);
			return;
		}
		callback(results[0]);
	});
}
function judge(ai1,ai2,content,callback)
{	
	var client=connect();
	client.query("select id,win,sum,Aid from status where ((Aid=" + ai1 + " and Bid=" + ai2 + ") or (Aid=" + ai2 + " and Bid=" + ai1 + ")) and sum!=0 limit 1",function(err,results){
		if(err){
			client.end();
			log("judge",err);
			callback(err);
			return;
		}
		var qry2,win,sum;
		if(results.length==0){
			win=0,sum=0;
			qry2="";
		}else{
			results[0].win = results[0].win / 2;
			if(results[0].Aid == ai2)  results[0].win = results[0].sum - results[0].win;
			win=results[0].win;
			sum=results[0].sum;
			qry2="update status set sum=0 where id=" + results[0].id;
		}
		if(content.result<3) sum++;
		if(content.result==1){
			win++;
		}else if(content.result==0){
			win+=0.5
		}
		//console.log(qry2);
		client.mquery(mysql.format(replace("update status set result=%RESULT,resultInfo='%RESULTINFO',log=?,win=%WIN,sum=%SUM where id=%ID",
						["%RESULT","%RESULTINFO","%WIN","%SUM","%ID"],
						[content.result,content.resultInfo,win*2,sum,content.id]),content.log),qry2,
			function(err){
				client.end();
				if(err){
					log("judge",err);
					callback(err);
					return;
				}
				judgeEmitter.emit("judge",content.id,content.result);
				if(content.result>=3 || ai1==ai2){
					callback();
					return;
				}
				ai1=AIIDlist[ai1];
				ai2=AIIDlist[ai2];
				ai1.allStatusNum++;
				ai2.allStatusNum++;
				ai1.user.allStatusNum++;
				ai2.user.allStatusNum++;
				if(content.result==1){
					ai1.winStatusNum+=1;
					ai1.user.winStatusNum+=1;
				}else if(content.result==2){
					ai2.winStatusNum+=1;
					ai2.user.winStatusNum+=1;
				}else{
					ai1.winStatusNum+=0.5;
					ai1.user.winStatusNum+=0.5;
					ai2.winStatusNum+=0.5;
					ai2.user.winStatusNum+=0.5;
				}
				if(results.length==0){
					ai1.allOPnum++;
					ai2.allOPnum++;
					ai1.user.allOPnum++;
					ai2.user.allOPnum++;
				}else{
					ai1.winOPnum-=results[0].win/results[0].sum;
					ai1.user.winOPnum-=results[0].win/results[0].sum;
					ai2.winOPnum-=1-results[0].win/results[0].sum;
					ai2.user.winOPnum-=1-results[0].win/results[0].sum;
				}
				ai1.winOPnum+=win/sum;
				ai1.user.winOPnum+=win/sum;
				ai2.winOPnum+=1-win/sum;
				ai2.user.winOPnum+=1-win/sum;
				/*pos1=AIranklist.find(ai1);
				ai1.score=ai1.winOPnum + ai1.allOPnum * 0.1;
				AIranklist.adjust(pos1,function(obj,rank){obj.rank=rank+1;});
				pos2=AIranklist.find(ai2);
				ai2.score=ai2.winOPnum + ai2.allOPnum * 0.1;
				AIranklist.adjust(pos2,function(obj,rank){obj.rank=rank+1;});
				updateUser(ai1.user);
				updateUser(ai2.user);
				function updateUser(user){
					user.score=0;
					pos=userranklist.find(user);
					for(i=0;i<user.allAI.length;i++) if(user.allAI[i].score>user.score){
						user.score=user.allAI[i].score;
					}
					userranklist.adjust(pos,function(obj,rank){obj.rank=rank+1;});
				}*/
				callback();
			}
		);
	});
}
function getLog(id,callback){
	var client=connect();
	client.query("select log from status where id=" + id,function(err,result){
		client.end();
		if(err){
			log("getLog",err);
			callback(err);
			return;
		}
		if(result.length == 0){
			callback();
		}else{
			callback(result[0].log);
		}
	});
}
function getPublicAI()
{
	return publicAI;
}
function getAllUser()
{
	return userranklist;
}
function getAllAI()
{
	return AIranklist;
}
function getUserbyID(id)
{
	return userIDlist[id];
}
function getAIbyID(id)
{
	return AIIDlist[id];
}

judgeEmitter = new events.EventEmitter();
function makebattle(ai1,ai2,callback)
{
	var client=connect();
	client.mquery(replace("INSERT INTO status (Aid,Bid,result,resultInfo) values ('%ID1','%ID2',-1,'<td colspan=2><font color=grey>Pending<font>')",["%ID1","%ID2"],[ai1,ai2]),
		"select last_insert_id()"
		,function(err,results){
			client.end();
			if(err){
				log("makebattle",err,"5s后重试");
				setTimeout(function(){makebattle(ai1,ai2,callback)},5000);
				return;
			}
			//log("tmp",JSON.stringify(results[1]));
			var id = results[1][0]["last_insert_id()"];
			judgeEmitter.on("judge",function listener(jid,result){
				if(jid == id){
					judgeEmitter.removeListener("judge",listener);
					callback(id,result);
				}
			});
			setTimeout(judgemode.judge, 2000);
		}
	);
}
function saveContest(contest,callback)
{
	var _ai=[];
	var aid = [];	
	for(i=0;i<contest.ai.length;i++){
		aid.push(contest.ai[i].id);
	}
	_ai.push(aid);
	if(contest.result >= 0 || contest.result==-2){
		var ascore = [];
		for(i=0;i<contest.ai.length;i++){
			ascore.push(contest.ai[i].score);
		}
		_ai.push(ascore);
	}
	if(contest.result == 1 || contest.result==-2){
		var aOPscore = [];
		for(i=0;i<contest.ai.length;i++){
			aOPscore.push(contest.ai[i].OPscore);
		}
		_ai.push(aOPscore);
	}
	_ai = JSON.stringify(_ai);

	var _log=null;
	if(contest.result>=0 || contest.result==-2){
		var _id=[],_result=[],ai1=[],ai2=[];
		for(i=0;i<contest.log.length;i++){
			_id.push(contest.log[i].id);
			_result.push(contest.log[i].result);
			ai1.push(contest.log[i].ai1);
			ai2.push(contest.log[i].ai2);
		}
		_log=JSON.stringify([_id,_result,ai1,ai2]);
	}
		
	var client=connect();
	client.query("update contest set ai=?,log=?,result=?,time=? where id=?",[_ai,_log,contest.result,contest.time,contest.id],function(err){
		client.end();
		if(err){
			log("saveContest",err);
			callback(err);
		}
		log("saveContest",contest.id);
		callback();
	});
		
}
function loadContest(contest)
{
	var _ai = [];

	contest.ai = JSON.parse(contest.ai);
	
	for(i=0;i<contest.ai[0].length;i++){
		_ai.push({id:contest.ai[0][i]});
	}
	if(contest.result>=0 || contest.result==-2){
		for(i=0;i<contest.ai[1].length;i++){
			_ai[i].score = contest.ai[1][i];
			if(contest.result==1 || contest.result==-2){
				_ai[i].OPscore = contest.ai[2][i];
			}
		}
	}
	contest.ai = _ai;

	if(contest.result>=0 || contest.result==-2){
		contest.log = JSON.parse(contest.log);
		var _log = [];
		for(i=0;i<contest.log[0].length;i++){
			_log.push({id:contest.log[0][i],result:contest.log[1][i],ai1:contest.log[2][i],ai2:contest.log[3][i]});
		}
		contest.log = _log;
	}
	
	log("load contest",contest.id);
	return Ccontest.Ccontest(contest.id,contest.name,contest.time,contest.ai,contest.result,contest.log);
}

function addContest(_name,time,callback)
{
	var client=connect();
	client.query(replace("insert into contest set name=?,time='%TIME',ai='[[]]',result=-1",["%TIME"],[date2str(time)]),_name,	
		function(err){
			client.end();
			if(err){
				log("addContest err");
				callback(err);
				return;
			}
			contestArr.splice(0,0,Ccontest.Ccontest(contestArr.length+1,_name,time,[],-1,null));
			log("addContest",contestArr.length);
			callback();
			return;
		}
	);
}
function getContest()
{
	return contestArr;
}

function findbattle(ai1,ai2,callback)
{
	var client=connect();
	client.query("select id from status where ((Aid=? and Bid=?) or (Aid=? and Bid=?)) ORDER BY id DESC limit 1",[ai1,ai2,ai2,ai1],
		function(err,result){
			client.end();
			if(err){
				log("findbattle err");
				callback(err);
				return;
			}
			if(result.length!=0){
				callback(err,result[0].id);
			}else{
				callback(err);
			}
			return;
		}
	);
}
function getAIUser(ai)
{
	return AIIDlist[ai].user.id;
}

exports.checkuser=checkuser;
exports.register=register;
exports.updateuser=updateuser;
exports.getPublicAI=getPublicAI;
exports.getAllAI=getAllAI;
exports.getAllUser=getAllUser;
exports.getUserbyID=getUserbyID;
exports.getAIbyID=getAIbyID;
exports.init=init;
exports.submitAI=submitAI;
exports.deleteAI=deleteAI;
exports.getSourcecode=getSourcecode;
exports.battle=battle;
exports.getStatus=getStatus;
exports.getJudgeContent=getJudgeContent;
exports.judge=judge;
exports.getLog=getLog;
exports.makebattle=makebattle;
exports.saveContest = saveContest;
exports.addContest = addContest;
exports.getContest = getContest;
exports.findbattle = findbattle;
exports.getAIUser = getAIUser;
