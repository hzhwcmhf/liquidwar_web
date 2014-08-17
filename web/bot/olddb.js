var mysql = require('mysql');
var util = require("util");

if(process.env.NODE_DEBUG) {
	var username = 'botadmin';
	var password = 'botpassword';
	var db_host = 'localhost';
	var db_port = '3306';
	var db_name = 'bot';
	var log = function(){
		var str = "";
		for(i=0;i<arguments.length;i++){
			str += JSON.stringify(arguments[i]) + "\t";
		}
		console.log(str);
	};
}else{
	//填写数据库连接信息，可查询数据库详情页
	var username = 'yourak';//API KEY
	var password = 'yoursk';//Secret KEY
	var db_host = 'sqld.duapp.com';
	var db_port = 4050;
	var db_name = 'yourdbname';
	var log = function(){};
}
var option = {
  host: db_host,
  port: db_port,
  user: username,
  password: password,
  database: db_name
}

var userNameToId={};


function connect()
{
	var client = mysql.createConnection(option);
	client.connect(function(err){
		if (err) {
			log("connect error",err);
			return;
		}
		log("connect successful");
	});
	
	client.on('error',function(err) {
		if (err.errno != 'ECONNRESET') {
			throw err;
		}
	});
	
	return client;
}


function userRegister(client,data,callback)
{
	client.query("SELECT * FROM USER where username='" + data.username + "'",
		function(err,results,fields) {
			if(err){
				log('userRegister',err);
				callback(err);
				return;
			}
			if(results.length){
				callback(new Error("用户名已存在"));
				return;
			}	
			client.query('INSERT INTO USER (username,password) VALUES ("' + data.username + '","' + data.password + '")',
				function(err,results) {
					if(err){
						log('userRegister',err);
						callback(err);
						return;
					}
					callback();
					return;
				}
			);
		}
	);
}

/*function userUpdate(client,data,callback) {
	var querystr = 'UPDATE USER SET ';
	for(i=0;i<data.key.length;i++){
		if(i!=0) querystr += ',';
		querystr += data.key[i] + '=' + data.value[i];
	}
	querystr += ' WHERE id = ' + data.id;
	client.query(querystr,
		function(err,results) {
			if(err){
				log('userUpdate',err);
				callback(err);
			}
			
			if(?) callback(new Error("该用户不存在"));
			
			callback();
		}
	);
}

function userLogin(client,data,callback) {
	client.query("SELECT * FROM USER where username='" + data.username + "'",
		function(err,results) {
			if(err){
				log('userLogin',err);
				callback(err);
			}
			if(?) callback(new Error("该用户不存在"));
			callback(?);
		}
	);
}

function codeSubmit(client,data,callback) {
	client.query('INSERT INTO CODE (' + data.key.join(',') + ') VALUES (' + data.value.join(',') + ')',
		function(err,results) {
			if(err){
				log('codeSubmit',err);
				callback(err);
			}
			callback();
		}
	);
}
function codeGet(client,id,callback) {
	client.query('SELECT code FROM CODE where id=' + id,
		function(err,results) {
			if(err){
				log('codeDelete',err);
				callback(err);
			}
			callback(?);
		}
	);
}
function codeDelete(client,id,callback) {
	client.query('DELETE FROM CODE where id=' + id,
		function(err,results) {
			if(err){
				log('codeDelete',err);
				callback(err);
			}
			if(?) callback(new Error("该代码不存在"));
			callback();
		}
	);
}

function matchStart(client,data,callback) {
	client.query('INSERT INTO MATCH (' + data.key.join(',') + ') VALUES (' + data.value.join(',') + ')',
		function(err,results) {
			if(err){
				log('matchStart',err);
				callback(err);
			}
			callback();
		}
	);
}
function matchList(client,callback) {
	client.query('SELECT * FROM MATCH where results=0 limit 1',
		function(err,results) {
			if(err){
				log('matchList',err);
				callback(err);
			}
			callback(?);
		}
	);
}
function matchUpdate(client,data,callback) {
	var querystr = 'UPDATE MATCH SET ';
	for(i=0;i<data.key.length;i++){
		if(i!=0) querystr += ',';
		querystr += data.key[i] + '=' + data.value[i];
	}
	querystr += ' WHERE id = ' + data.id;
	client.query(querystr,
		function(err,results) {
			if(err){
				log('matchUpdate',err);
				callback(err);
			}
			
			if(?) callback(new Error("该对局不存在"));
			
			callback();
		}
	);
}
*/
function checkuser(username,password,callback)
{
	if(typeof(userNameToId["USER_"username])!="undefined"){
		callback(-1);
		return;
	}
	var client=connect();
	client.query("SELECT password FROM USER where id='" + userNameToId["USER_"username] + "'",
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
				callback(userNameToId["USER_"username]);
			}
		}
	);
}
function register(username,password,email,motto,callback)
{
	if(typeof(userNameToId["USER_"username])!="undefined"){
		callback(-1);
		return;
	}else{
		var client=connect();
		client.query('INSERT INTO user (username,password,email,motto) VALUES (' + [username,password,email,motto].join(',') + ')',
			function(err,results) {
				client.end();
				if(err){
					log('register',err);
					callback(err);
				}
				callback();
			}
		);
	}
}
function updateuser(userid,password,email,motto,callback)
{
	var client=connect();
	client.query("UPDATE USER SET password=" + password + ",email=" + email + ",motto=" + motto + " WHERE id=" + userid,
		function(err){
			client.end();
			if(err){
				log('updateuser',err);
				callback(err);
			}
			callback();
		}
	);
}

exports.checkuser=checkuser;
