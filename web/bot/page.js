var database = require('./database');
var judgemode = require("./judge");
function multiString(f){
	return f.toString().replace(/^[^\/]+\/\*!?\s?/, '').replace(/\*\/[^\/]+$/, '');
}
var AITYPE=["","public","private","deleted"];
var LANGUAGE=["C","C++","Pascal","Java","Ruby","Bash","Python"];
function stringzip(str,i)
{
	var tmp=[];
	while(i--){
		tmp.push(str);
	}
	return tmp.join("");
}
var log = function(){
		var str = date2str(new Date()) + ":";
		for(i=0;i<arguments.length;i++){
			//str += JSON.stringify(arguments[i]) + "\t";
			str += arguments[i] + "\t";
		}
		console.log(str);
	};
function date2str(x) {
	y="yyyy-MM-dd hh:mm:ss";
	var z ={y:x.getFullYear(),M:x.getMonth()+1,d:x.getDate(),h:x.getHours(),m:x.getMinutes(),s:x.getSeconds()};
    return y.replace(/(y+|M+|d+|h+|m+|s+)/g,function(v) {return ((v.length>1?"0":"")+eval('z.'+v.slice(-1))).slice(-(v.length>2?v.length:2))});
}
function str2date(s) {
    var r = s.match(/\d+/g);
    if(r.length!=6) return;
    return new Date(r[0],r[1]-1,r[2],r[3],r[4],r[5]);
}
function getUserinfoP()
{

	userinfoLoginhtml = multiString(function() {
			/*
					<th width="12%"><a href="login">登录</a></th>
					<th width="12%"><a href="register">注册</a></th>
			*/
		}
	);
	userinfoLogouthtml = multiString(function() {
			/*
					<th width="12%"><a href="modifyuser">修改个人信息</a></th>
					<th width="12%"><a href="userinfo?id=%USERID"><font color="red">%USERNAME</font></a></th>
					<th width="12%"><a href="logout">注销</a></th>
			*/
		}
	);
	return function(req) {
		if(typeof(req.session.username) == 'undefined') {				
			return userinfoLoginhtml;
		}else{
			return replace(userinfoLogouthtml,["%USERID","%USERNAME"],[req.session.userid,req.session.username]);
		}
	};
}
getUserinfo = getUserinfoP();

var noticeHtml = "";
function getNotice()
{
	if(noticeHtml == ""){
		noticeHtml = multiString(function() {
			/*
网站到最后也大概是试运行，所以数据库随时可能回档，请妥善保管好自己的代码。<br>从今天开始的比赛，每轮之间会有10分钟暂停时间以供参赛选手撤换AI；决赛每轮之间都会有1天暂停时间。该功能也是新上线，不知道稳不稳定。
			*/
		});
	}
	return noticeHtml;
}

function getheadP() {
	headhtml = [];
	headhtml.push(multiString(function() {
		/*
			<html>
			<head>
				<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
				<link rel=stylesheet href='include/hoj.css' type='text/css'>
				<LINK href="favicon.ico" type="image/x-icon" rel=icon>
				<LINK href="favicon.ico" type="image/x-icon" rel="shortcut icon">	
			</head>
			<body>
			<center>
			<div style="width:90%; text-align:left">
			<img src="image/logo.png"/>
			</div>
			<table width=90%> 
				<tr align="center" class='hd' valign="top">
					<th width="10%"><a href="/">首页</a></th>
					<th width="10%"><a href="battle">对战</a></th>
					<th width="10%"><a href="status">战况</a></th>
					<th width="10%"><a href="userrank">排名</a></th>
					<th width="10%"><a href="contest">比赛</a></th>
					<th width="10%"><a href="help">帮助</a></th>
			*/
	}));
	headhtml.push("");
	headhtml.push(multiString(function() {
			/*
				</tr>
			</table>
			</center>
			<center>
			<div class="notice">
				<div>
					<B>Notice:</B>
			*/
	}));
	headhtml.push("");
	headhtml.push(multiString(function() {
			/*
				</div>
			</div>
			</center>
			*/
	}));

	return function(req) {
		headhtml[1] = getUserinfo(req);
		headhtml[3] = getNotice();
		return headhtml.join("");
	}	
}
gethead = getheadP();

function gettailP() {
	tailhtml = multiString(function() {
			/*
			<br>
			<hr>
			<center>
				<div class="footer">
					<div>网页风格/评测内核:Based on opensource project <a href="http://hustoj.googlecode.com">hustoj</a>.</div>
					<div>网页内核(nodejs express)/评测内核修改:hzhwcmhf</div>
					<div>评测逻辑/客户端平台:vfleaking</div>
					<div>响应时间:%RESTIMEms</div>
				</div>
			</center>
			</body>
			</html>
			*/
	});
	return function(req)
	{
		return tailhtml.replace("%RESTIME",new Date().getTime()-req.receiveTime);
	};
}
gettail = gettailP();	

function indexP(){
	indexhtml = multiString(function() {
		/*
			<title>液体战争--在线测试平台</title>
			<br>
			<center>
			<table width=90%>
			<tr><td width=50% valign=top>

			<h2>赛程</h2>
			<table width=100%>
			<tr><td width=30%>6月22日 19:30<td>练习赛1
			<tr><td>6月29日 19:30<td>练习赛2
			<tr><td>7月6日 19:30<td>练习赛3
			<tr><td>7月13日 19:30<td>练习赛4
			<tr><td>8月3日 19:30<td>练习赛5
			<tr><td>8月8日 19:30<td>练习赛6
			<tr><td>8月9日 19:30<td>练习赛7
			<tr><td>8月10日 19:30<td>决赛
			</table>
			决赛一天评测一轮，将在noip吧开贴直播，具体一轮的定义请查看FAQ。
			<br><br>
			<hr width = "100%" style = "border:1px solid #1a5cc8;">
			
			<h2>游戏背景</h2>
			&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;在很遥远的地方有一个星球，上面的几乎全是固体，液态物质很少。经过漫长的演化，有一天液体内部突然产生了精细结构，从而有了自己的意识。紧接着，这个星球很快被液态生命布满了。<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;液体是没有脑子的，没有脑子就无法思考。<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;在漫长的演化过程中，液体终于发现最佳的策略是让一部分个体聚集起形成一个大脑，通过奇妙的电信号来指导其它液体的行动。这样才不会乱成一团。<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;以硫酸为首的酸率先发现了这样优秀的生活方式，聚集了一个由酸组成的大脑。紧接着以氢氧化钠为首的碱也组成了一个由碱组成的大脑。于是酸和碱的领地不断扩张，最后几乎瓜分了整个星球。<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;但是，酸和碱的敌对关系是与生俱来的：酸生活的地方，碱就不能生存；碱生活的地方，酸就不能生存。终于，液体战争一触即发。<br><br>
			游戏规则/客户端平台/样例下载:<a href="http://pan.baidu.com/s/1jGBlgf8">http://pan.baidu.com/s/1jGBlgf8</a>
			<br><br>
			样例程序虽然写得很长但是实现的功能很全面，你可以在样例的基础上改写。（内置了部分红警操作及快捷键。）

			<br><br>
			<hr width = "100%" style = "border:1px solid #1a5cc8;">
			<h2>更新日志</h2>
			2014/8/3:增加比赛轮间暂停功能。练习赛轮间暂停10分钟，决赛轮间暂停1天。<br>
			2014/6/19:赛程确定，决赛置顶显示。修正FAQ说明中的一点错误。无故RE的问题还未解决。<br>
			2014/6/17:新版客户端下载liquidwar_v2.jar。平台更流畅(雾)，每次本地对战都会有log文件保存在log文件夹下，修正了部分操作系统不能显示中文的bug。<br>
			2014/6/8:增加记录搜索功能，暂时只支持用AI_ID搜索。在AI详细页面有“查看所有记录”的链接。提交已经测试过的战斗现在会要求确认。<br>
			2014/6/6:修正签名栏长度显示不全BUG，更新比赛FAQ，增加比赛倒计时。<br>
			2014/6/5:第一次比赛结束，修复一个比赛测评BUG。<br>
			2014/6/3:比赛功能上线，修正分数计算错误。<br>
			<td width=50% valign=top>
			<img src="/image/screenshot.jpg" width=100% alt="游戏截图" />
			
			</table>
			</center>
		*/
	});
	return function(req,res) {
		var html = [];
		html.push(gethead(req));
		html.push(indexhtml);
		html.push(gettail(req));
		res.send(html.join(""));
	}
}

function loginP(){
	loginhtml = multiString(function() {
		/*
			<title>登录</title>
			<br><br>
			<script type="text/javascript" src="md5.js"></script>
			<script type="text/javascript">
				function check(field) {
					with(field) {
						password.value = MD5(password.value);
						return true;
					}
				}
			</script>
			<form action="login" method=post onsubmit='return check(this)'>
				<center>
				<table width=400 algin=center>
				<tr><td width=25%>用户名:<td width=75%><input name="username" type="text" size=20></tr>
				<tr><td>密码:<td><input name="password" type="password" size=20></tr>
				<tr><td><td><input name="submit" type="submit" size=10 value="Submit"></tr>
				</table>
				<center>
			</form>
			<br><br>
			﻿<br>
		*/
	});
	toLogouthtml = multiString(function() {
		/*
			<title>登录</title>
			<br><br>
			<a href="logout">Please logout First!</a>
		*/
	});
	return function(req,res) {
		var html = [];
		html.push(gethead(req));
		if(typeof(req.session.username)!='undefined'){
			html.push(toLogouthtml);
		}else{
			html.push(loginhtml);
		}
		html.push(gettail(req));
		res.send(html.join(""));
	};
}

function loginCheckP()
{
	loginCheckhtml = multiString(function() {
	/*
		<script language='javascript'>
		history.go(-2);
		</script>
	*/
	});
	loginCheckWronghtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('UserName or Password Wrong!');
		history.go(-1);
		</script>
	*/
	});
	return function(req,res) {
		database.checkuser(req.body.username,req.body.password,function(userid) {
			if(userid==-1){
				res.send(loginCheckWronghtml);
			}else if(userid>=0){
				req.session.userid=userid;
				req.session.username=req.body.username;
				res.redirect('../');
			}else{
				error(req,res,"数据库错误:" + userid);
			}
		});
	};
}
function logoutP()
{
	logouthtml = multiString(function() {
	/*
		<script language='javascript'>
		history.go(-1);
		</script>
	*/
	});
	return function(req,res) {
		if(typeof(req.session.username)=='undefined'){
			res.redirect('login');
		}else{
			req.session = null;
			res.redirect('../');
			//res.send(logouthtml);
		}
	}
}

function txtTohtml(str)
{
	return str.replace(/&/gi,"&amp;").replace(/</gi,"&lt;").replace(/>/gi,"&gt;").replace(/ /gi,"&nbsp;").replace(/\n/gi,"<br>");
}
function txtTohtmlSingle(str)
{
	return str.replace(/&/gi,"&amp;").replace(/</gi,"&lt;").replace(/>/gi,"&gt;").replace(/ /gi,"&nbsp;");
}
function htmlTotxt(str)
{
	return str.replace(/<br>/gi,"\n").replace(/&nbsp;/gi," ").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&amp;/gi,"&");
}

function registerP()
{
	registerhtml = multiString(function() {
		/*
			<script type="text/javascript" src="md5.js"></script>
			<script type="text/javascript">
				function check(field) {
					with(field) {
						if(username.value.length < 5 || username.value.length > 16) {
							alert("用户名长度必须在5-16之间。");
							username.focus();
							return false;
						}else if(!username.value.match(/^[a-zA-Z0-9_]{1,}$/)){
							alert("用户名必须由大小写字母、数字或下划线组成。");
							username.focus();
							return false;
						}else if(password.value.length < 5 || password.value.length > 16) {
							alert("密码长度必须在5-16之间。");
							rptpassword.value = password.value = "";
							password.focus();
							return false;
						}else if(password.value!=rptpassword.value){
							alert("两次输入密码不一致。");
							rptpassword.value = password.value = "";
							password.focus();
							return false;
						}else if(motto.length>256) {
							alert("个性签名不能超过256字节。");
							motto.focus();
							return false;
						}
						rptpassword.value = password.value = MD5(password.value);
						return true;
					}
				}
			</script>
			<title>用户注册</title>
			<form action="register" onsubmit="return check(this)" method="post">
				<br><br>
				<center><table>
					<tr><td colspan=2 height=40 width=500>用户注册</tr>
					<tr><td width=25%>用户名:
						<td width=75%><input name="username" size=20 type=text>*
					</tr>
					
					<tr><td>密码:
						<td><input name="password" size=20 type=password>*
					</tr>
					<tr><td>再输入一次密码:
						<td><input name="rptpassword" size=20 type=password>*
					</tr>
					<tr><td>邮箱:
						<td><input name="email" size=30 type=text>
					</tr>
					<tr><td>个性签名:
						<td><textarea name="motto" cols=22></textarea>
					</tr>
					<tr><td>
						<td><input value="提交" name="submit" type="submit">
							&nbsp; &nbsp;
							<input value="重置" name="reset" type="reset">
					</tr>
				</table></center>
				<br><br>
			</form>
			﻿<br>
		*/
	});
	toLogouthtml = multiString(function() {
		/*
			<title>LOGIN</title>
			<br><br>
			<a href="logout">Please logout First!</a>
		*/
	});
	return function(req,res) {
		var html = [];
		html.push(gethead(req));
		if(typeof(req.session.username)!='undefined'){
			html.push(toLogouthtml);
		}else{
			html.push(registerhtml);
		}
		html.push(gettail(req));
		res.send(html.join(""));
	};
}
function registercheckP()
{
	registerWronghtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('%s');
		history.go(-1);
		</script>
	*/
	});
	registerSuccessfulhtml = multiString(function() {
		/*
			<script language='javascript'>
			alert('注册成功');
			location.href="login";
			</script>
		*/
	});
	toLogouthtml = multiString(function() {
		/*
			<title>LOGIN</title>
			<br><br>
			<a href="logout">Please logout First!</a>
		*/
	});
	return function(req,res) {
		if(typeof(req.session.username)!='undefined'){
			var html = [];
			html.push(gethead(req));
			html.push(toLogouthtml);
			html.push(gettail(req));
			res.send(html.join(""));
			return;
		}
		req.body.email=txtTohtml(req.body.email);
		req.body.motto=txtTohtml(req.body.motto);
		if(req.body.username.length < 5 || req.body.username > 16) {
			res.send(registerWronghtml.replace("%s","用户名长度必须在5-16之间。"))
		}else if(!req.body.username.match(/^[a-zA-Z0-9_]{1,}$/)) {
			res.send(registerWronghtml.replace("%s","用户名必须由大小写字母、数字或下划线组成。"))
		}else if(req.body.password.length != 32) {
			res.send(registerWronghtml.replace("%s","未知错误。ERROR:101"));
		}else if(req.body.email.length > 128) {
			res.send(registerWronghtml.replace("%s","你的邮箱为何这么长?"));
		}else if(req.body.motto.length > 512) {
			res.send(registerWronghtml.replace("%s","个性签名过长。"));
		}else{
			database.register(req.body.username,req.body.password,req.body.email,req.body.motto,function(err){
				if(err==-1){
					res.send(registerWronghtml.replace("%s","该用户名已存在。"));
				}else if(err){
					error(req,res,"数据库错误:" + err);
				}else{
					res.send(registerSuccessfulhtml);
				}
			});
		}
	}
}
function modifyUserP()
{
	modifyUserhtml = multiString(function() {
		/*
			<script type="text/javascript" src="md5.js"></script>
			<script type="text/javascript">
				function check(field) {
					with(field) {
						if(password.value.length==0 && rptpassword.value.length==0) {
							password.value = opassword.value;
							rptpassword.value = opassword.value;
						}
						if(password.value.length < 5 || password.value.length > 16) {
							alert("密码长度必须在5-16之间。");
							rptpassword.value = password.value = "";
							password.focus();
							return false;
						}else if(password.value!=rptpassword.value){
							alert("两次输入密码不一致。");
							rptpassword.value = password.value = "";
							password.focus();
							return false;
						}
						rptpassword.value = password.value = MD5(password.value);
						opassword.value = MD5(opassword.value);
						return true;
					}
				}
			</script>
			<title>更改用户信息</title>
			<form action="modifyuser" method="post" onsubmit="return check(this)">
				<br><br>
				<center><table>
					<tr><td colspan=2 height=40 width=700>更改用户信息</tr>
					<tr><td width=25%>用户名:
						<td width=75%>%USERNAME
					</tr>
					<tr><td>原密码:
						<td><input name="opassword" size=20 type=password>*
					</tr>
					<tr><td>新密码(不修改留空):
						<td><input name="password" size=20 type=password>*
					</tr>
					<tr><td>再输入一次密码:
						<td><input name="rptpassword" size=20 type=password>*
					</tr>
					<tr><td>邮箱:
						<td><input name="email" size=30 type=text value="%EMAIL">
					</tr>
					<tr><td>个性签名:
						<td><textarea name="motto" cols=30>%MOTTO</textarea>
					</tr>
					<tr><td>
						<td><input value="提交" name="submit" type="submit">
							&nbsp; &nbsp;
							<input value="重置" name="reset" type="reset">
					</tr>
				</table></center>
				<br><br>
			</form>
			﻿<br>
		*/
	});
	return function(req,res) {
		if(typeof(req.session.username)=='undefined'){
			res.redirect("login");
			return;
		}
		var html = [];
		var user = database.getUserbyID(req.session.userid);
		html.push(gethead(req));
		html.push(replace(modifyUserhtml,["%USERNAME","%MOTTO","%EMAIL"],[user.username,htmlTotxt(user.motto),user.email]));
		html.push(gettail(req));
		res.send(html.join(""));
	};
}
function modifyUserCheckP()
{
	modifyUserWronghtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('%s');
		history.go(-1);
		</script>
	*/
	});
	return function(req,res) {
		if(typeof(req.session.username)=='undefined'){
			res.redirect("login");
			return;
		}
		if(req.body.password.length != 32) {
			res.send(registerWronghtml.replace("%s","未知错误。ERROR:101"));
			return;
		}
		database.checkuser(req.session.username,req.body.opassword,function(userid){
			if(userid==-1){
				res.send(modifyUserWronghtml.replace("%s","密码不正确。"));
			}else if(userid>=0){
				req.body.email=txtTohtml(req.body.email);
				req.body.motto=txtTohtml(req.body.motto);
				database.updateuser(userid,req.body.password,req.body.email,req.body.motto,function(err){
					if(err){
						error(req,res,"数据库错误:" + userid);
						return;
					}
					res.redirect("../");
				});
			}else{
				error(req,res,"数据库错误:" + userid);
			}
		});
	}
}

if(process.env.NODE_DEBUG) {
	var replace = function(str,from,to)
	{
		if(from.length!=to.length){
			console.log("replace不匹配")
			throw(new Error("replace不匹配"));
		}
		var i;
		for(i=0;i<from.length;i++){
			str = str.replace(RegExp(from[i],"g"),to[i]);
		}
		return str;
	};
}else{
	var replace = function(str,from,to)
	{
		var i;
		for(i=0;i<from.length;i++){
			str = str.replace(RegExp(from[i],"g"),to[i]);
		}
		return str;
	};
}

function battleP()
{
	battle1html  = multiString(function() {
		/*
			<title>对战</title>
			<script type="text/javascript">
				function check(field) {
					with(field) {
						if(player1.value=="" || player2.value=="") {
							alert("请选择AI。");
							return false;
						}
						return true;
					}
				}
				function confirmDel(name,id) {
					if(confirm('确定要删掉'+name+'吗?')){
						location.href="deleteAI?id="+id;
					}
				}
			</script>
			<center>
				<table id='problemset' width='90%'>
					<thead>

						<tr align=center class='toprow'>
							<td width='25%'><A>我的AI</A>
							<td width='35%'><a>创建时间</a></td>
							<td width='10%'><A>模式</A></td>
							<td width='30%'><A>操作</A></td>
						</tr>
					</thead>
		
					<tbody>
		*/
	});
	battlemybothtml = multiString(function() {
		/*
			<tr class='%ROWSTYLE'>
				<td align='center'>%AINAME</td>
				<td align='center'>%TIME</td>
				<td align='center'>%TYPE</td>
				<td align='center'><a href='AIinfo?id=%AIID'>查看详细</a> &nbsp; &nbsp; &nbsp; <a href='javascript:confirmDel("%AINAME",%AIID)'>删除</a></td>
			</tr>
		*/
	});
	battle2html = multiString(function() {
		/*
					</tbody>

					<tfoot>
						<td></td>
						<td></td>
						<td></td>
						<td align='center'><a href="submit">提交新AI</a></td>
					</tfoot>
				</table>
			

			<br>
			<hr width = "90%" style = "border:1px solid #1a5cc8;">

			<form method="post" action="battle" name="select" onsubmit='return check(this)'>
				<table width = "90%">
					<thead>
						<tr align='center' class='toprow'>
							<td width='50%'>Player 1:</td>
							<td width='50%'>Player 2:</td>
						</tr>
					</thead>
					
					<tbody>
						<tr>
						    <td>
						        <select size="20" name="player1" style="width:100%">
		*/
	});

	battleselecthtml = multiString(function() {
		/*
						<option disabled="disabled">我的AI:</option>
						<option>1</option>
						<option>2</option>
						<option>3</option>
						<option>4</option>
						<option>5</option>
						<option disabled="disabled">公开的AI:</option>
						<option>1</option>
						<option>2</option>
						<option>3</option>
						<option>4</option>
						<option>5</option>
		*/
	});
	
	battle3html = multiString(function() {
		/*
			</select>
                </td>
                <td>
                	<select size="20" name="player2" style="width:100%">
        */
	});
	battle4html = multiString(function() {
		/*
						</select>
						    </td>
						</tr>
					</tbody>
				
				</table>
				<input value="提交对战" name="submit" type="submit">
			</form>
			</center>﻿
		*/
	});
	
	return function(req,res) {
		if(typeof(req.session.username)=='undefined'){
			res.redirect("login");
			return;
		}
		var html = [],i;
		var mybot=[];
		var allAI=database.getUserbyID(req.session.userid).allAI;
		for(i=0;i<allAI.length;i++) if(allAI[i].type!=3){
			mybot.push(allAI[i]);
		}

		
		var allbot=database.getPublicAI();
		
		html.push(gethead(req));
		html.push(battle1html);
		for(i=0;i<mybot.length;i++){		
			html.push(replace(battlemybothtml,
				["%ROWSTYLE","%AINAME","%TIME","%TYPE","%AIID"],
				[(i&1)?"ODDROW":"EVENROW",mybot[i].AIname,date2str(mybot[i].time),AITYPE[mybot[i].type],mybot[i].id]));
		}
		html.push(battle2html);

		if(typeof(req.body.op)=='undefined')
			req.body.op = 0;
		
		var selectArr = [],target,pos;
		selectArr.push('<option disabled="disabled">我的AI:</option>');

		for(i=0;i<mybot.length;i++){
			if(mybot[i].id==req.query.op){
				pos=selectArr.length;
				target='<option value=' + mybot[i].id + ' style="font-family: monospace;" selected>'+ mybot[i].user.username + stringzip("&nbsp;",20-mybot[i].user.username.length) + mybot[i].AIname +'</option>';
			}
			selectArr.push('<option value=' + mybot[i].id + ' style="font-family: monospace;">'+ mybot[i].user.username + stringzip("&nbsp;",20-mybot[i].user.username.length) + mybot[i].AIname +'</option>');
		}
		selectArr.push('<option disabled="disabled">公开的AI:</option>');
		for(i=0;i<allbot.length;i++) if(allbot[i].userid!=req.session.userid){
			if(allbot[i].id==req.query.op){
				pos=selectArr.length;
				target='<option value=' + allbot[i].id + '  style="font-family: monospace;" selected>'+ allbot[i].user.username + stringzip("&nbsp;",20-allbot[i].user.username.length) + allbot[i].AIname +'</option>';
			}
			selectArr.push('<option value=' + allbot[i].id + ' style="font-family: monospace;">'+ allbot[i].user.username + stringzip("&nbsp;",20-allbot[i].user.username.length) + allbot[i].AIname +'</option>');
		}
		
		html.push(selectArr.join("\n"));
		html.push(battle3html);
		if(typeof(target)!='undefined'){
			selectArr[pos] = target;
		}
		html.push(selectArr.join("\n"));
		html.push(battle4html);
		html.push(gettail(req));
		res.send(html.join(""));
	}
}

function userrankP()
{
	userrank1html = multiString(function() {
		/*
		<title>用户排名</title>
		<center>
			<table width=90%>
				<tr>
					<td colspan=3 align=left>
						<form action='userrank' method='get'>
							用户搜索
							<input name=user>
							<input type=submit value="搜索未实现" disabled=true>
						</form>
					</td>
					<td colspan=2 align=right>
						<a href=userrank>User</a>
					</td>
					<td align=center>
						<a href=AIrank>AI</a>
					</td>
				</tr>
				<tr class='toprow'>
					<td width=5% align=center><b>No.</b>
					<td width=10% align=center><b>用户名</b>
					<td width=55% align=center><b>个人简介</b>
					<td width=10% align=center><b>历史AI数</b>
					<td width=10% align=center><b>公开AI数</b>
					<td width=10% align=center><b>得分</b>
				</tr>
		*/
	});
	userrankuserhtml = multiString(function() {
		/*
			<tr class='%ROWSTYLE'>
				<td align=center>%RANK
				<td align=center><a href='userinfo?id=%USERID'>%USERNAME</a>
				<td align=center>%MOTTO
				<td align=center><a>%ALLAINUM</a>
				<td align=center><a>%PUBLICAINUM</a>
				<td align=center>%SCORE
			</tr>
		*/
	});
	
	userrank2html = multiString(function() {
		/*
					<tr>
						<td colspan=3 align=left>
							<form action="userrank" method="get">
								转到第<input name="page" size="1" value="%NOWPAGE">页(共%PAGENUM页)
								<input type=submit value=Go>
							</form>
						</td>
						<td colspan=3 align=right>
		*/
	});
	userrank3html = multiString(function() {
		/*
						</td>
					</tr>
				</table>
			</center>		
		*/
	});
	
	return function(req,res){
		if(typeof(req.query.page)=='undefined' || !req.query.page.match(/^[0-9]+$/) || req.query.page<1)
			req.query.page=1;
		else
			req.query.page=parseInt(req.query.page);
		var ListPerPage = 20;
		var html = [];
		html.push(gethead(req));
		html.push(userrank1html);
		var user = database.getAllUser(),i;
		var s=(req.query.page-1)*ListPerPage,t=Math.min(s+ListPerPage,user.length);
		for(i=s;i<t;i++){
			html.push(replace(userrankuserhtml,
			["%ROWSTYLE","%RANK","%USERID","%USERNAME","%MOTTO","%ALLAINUM","%PUBLICAINUM","%SCORE"],
			[(i&1)?"ODDROW":"EVENROW",i+1,user[i].id,user[i].username,user[i].motto,user[i].allAI.length,user[i].publicAI.length,user[i].score.toFixed(2)]));
		}
		html.push(replace(userrank2html,
			["%NOWPAGE","%PAGENUM"],[req.query.page,Math.floor(user.length/ListPerPage)+1]));
		if(req.query.page!=1){
			html.push('<a href="userrank">首页</a>\n');
			html.push('<a href="userrank?page=' + (req.query.page-1) + '">上一页</a>\n');
		}
		if(req.query.page<Math.floor(user.length/ListPerPage)+1){
			html.push('<a href="userrank?page=' + (req.query.page+1) + '">下一页</a>\n');
			html.push('<a href="userrank?page=' + Math.floor(user.length/ListPerPage+1) + '">末页</a>\n');
		}
		html.push(userrank3html);
		html.push(gettail(req));
		res.send(html.join(""));
	}
}

function AIrankP()
{
	AIrank1html = multiString(function() {
		/*
		<title>AI排名</title>
		<center>
			<table width=90%>
				<tr>
					<td colspan=8 align=left>
						<form action='AIrank' method='get'>
							AI搜索
							<input name=AIname>
							<input type=submit value='搜索未实现' disabled=true>
						</form>
					</td>
					<td align=right>
						<a href=userrank>User</a>
					</td>
					<td align=center>
						<a href=AIrank>AI</a>
					</td>
				</tr>
				<tr class='toprow'>
					<td width=5% align=center><b>No.</b>
					<td width=10% align=center><b>AI名</b>
					<td width=10% align=center><b>用户名</b>
					<td width=10% align=center><b>类型</b>
					<td width=10% align=center><b>对战次数</b>
					<td width=10% align=center><b>获胜次数</b>
					<td width=10% align=center><b>对战AI数</b>
					<td width=10% align=center><b>均胜场数</b>
					<td width=10% align=center><b>胜率</b>
					<td width=15% align=center><b>得分</b>
				</tr>
		*/
	});
	AIrankAIhtml = multiString(function() {
		/*
			<tr class='%ROWSTYLE'>
				<td align=center>%RANK
				<td align=center><a href='AIinfo?id=%AIID'>%AINAME</a>
				<td align=center><a href='userinfo?id=%USERID'>%USERNAME</a>
				<td align=center>%TYPE
				<td align=center>%ALLSTATUSNUM
				<td align=center>%WINSTATUSNUM
				<td align=center>%ALLOPNUM
				<td align=center>%WINOPNUM
				<td align=center>%WINNING
				<td align=center>%SCORE
			</tr>
		*/
	});	
	AIrank2html = multiString(function() {
		/*
					<tr>
						<td colspan=6 align=left>
							<form action="AIrank" method="get">
								转到第<input name="page" size="1" value="%NOWPAGE">页(共%PAGENUM页)
								<input type=submit value=Go>
							</form>
						</td>
						<td colspan=4 align=right>
		*/
	});
	AIrank3html = multiString(function() {
		/*
						</td>
					</tr>
				</table>
			</center>
		*/
	});
	
	return function(req,res){
		if(typeof(req.query.page)=='undefined' || !req.query.page.match(/^[0-9]+$/) || req.query.page<1)
			req.query.page=1;
		else
			req.query.page=parseInt(req.query.page);
		var ListPerPage = 50;
		var html = [];
		html.push(gethead(req));
		html.push(AIrank1html);
		var AI=database.getAllAI(),i;
		var s=(req.query.page-1)*ListPerPage,t=Math.min(s+ListPerPage,AI.length);

		for(i=s;i<t;i++){
			html.push(replace(AIrankAIhtml,
			["%ROWSTYLE","%RANK","%AIID","%AINAME","%USERID","%USERNAME","%TYPE","%ALLSTATUSNUM","%WINSTATUSNUM","%ALLOPNUM","%WINOPNUM","%WINNING","%SCORE"],
			[(i&1)?"ODDROW":"EVENROW",i+1,AI[i].id,AI[i].AIname,AI[i].userid,AI[i].user.username,AITYPE[AI[i].type],AI[i].allStatusNum,AI[i].winStatusNum.toFixed(2),AI[i].allOPnum,AI[i].winOPnum.toFixed(2),(AI[i].winOPnum/AI[i].allOPnum*100).toFixed(2)+"%",AI[i].score.toFixed(2)]));
		}
		
		html.push(replace(AIrank2html,
			["%NOWPAGE","%PAGENUM"],[req.query.page,Math.floor(AI.length/ListPerPage)+1]));
		if(req.query.page!=1){
			html.push('<a href="AIrank">首页</a>\n');
			html.push('<a href="AIrank?page=' + (req.query.page-1) + '">上一页</a>\n');
		}
		if(req.query.page<Math.floor(AI.length/ListPerPage)+1){
			html.push('<a href="AIrank?page=' + (req.query.page+1) + '">下一页</a>\n');
			html.push('<a href="AIrank?page=' + Math.floor(AI.length/ListPerPage+1) + '">末页</a>\n');
		}
		html.push(AIrank3html);
		html.push(gettail(req));
		res.send(html.join(""));
	}
}

function statusP()
{
	status1html = multiString(function() {
		/*
			<title>战况</title>
			<center>
			<script language="Javascript" type="text/javascript">
				with(field) {
					if((ai1!="" && !ai1.value.match(/^[a-zA-Z0-9_]{1,}$/)
						||(ai2!="" && !ai2.value.match(/^[a-zA-Z0-9_]{1,}$/)){
						alert("请填入AIID号(数字，可以在AI详细信息中看到)。");
						return false;
					}
					return true;
				}
			</script>
			<table align=center width="90%">
				<tr>
					<td colspan=5>
						<form id="search" action="status" method="get" onsubmit='return check(this)'>
							<!--用户名:<input type=text size=6 name=username value=''>
							AI名:<input type=text size=6 name=AIname value=''>-->
							AI_ID1:<input type=text size=6 name=ai1 value=''>
							AI_ID2:<input type=text size=6 name=ai2 value=''>
						<input type=submit value='搜索'>
						</form>
					</td>
					<td width="17%"></td>
					<td width="17%"></td>
					<td colspan=2 align=right>评测机状态:%JUDGESTATUS</td>
				</tr>
				<tr class='toprow'>
					<td width="4%">RunID
					<td width="10%">player1
					<td width="10%">AI1
					<td width="10%">player2
					<td width="10%">AI2
					<td width="34%" colspan=2>结果
					<td width="4%">LOG
					<td width="18%">时间
				</tr>
		*/
	});
	statusbodyhtml = multiString(function() {
		/*
			<tr align=center class='%ROWSTYLE'>
				<td>%ID
				<td><a href="userinfo?id=%USERID1">%USER1</a>
				<td><a href="AIinfo?id=%AIID1">%AI1</a>
				<td><a href="userinfo?id=%USERID2">%USER2</a>
				<td><a href="AIinfo?id=%AIID2">%AI2</a>
				%INFO
				<td>%LOG
				<td>%TIME
			</tr>
		*/
	});
	status2html = multiString(function() {
		/*
			</table>
				<a href=status>首页</a>&nbsp;&nbsp;
				<a href=status?down=%DOWNID>上一页</a>&nbsp;&nbsp;
				<a href=status?top=%TOPID>下一页</a>
			</center>
			﻿<br>
		*/
	});
	return function(req,res) {
		if(typeof(req.query.down)=='undefined' || !req.query.down.match(/^[0-9]+$/)){
			req.query.down=-1;
		}else{
			req.query.down=parseInt(req.query.down);
			delete req.query.top;
		}
		if(typeof(req.query.top)=='undefined' || !req.query.top.match(/^[0-9]+$/)){
			req.query.top=-1;
		}else{
			req.query.top=parseInt(req.query.top);
		}

		var limit="";
		if(typeof(req.query.ai1)=='undefined' || !req.query.ai1.match(/^[0-9]+$/)){
			req.query.ai1=0;
		}else{
			limit += "ai1=" + req.query.ai1 + "&";
		}
		if(typeof(req.query.ai2)=='undefined' || !req.query.ai2.match(/^[0-9]+$/)){
			req.query.ai2=0;
		}else{
			limit += "ai2=" + req.query.ai2 + "&";
		}
		
		var html = [];
		html.push(gethead(req));
		html.push(status1html.replace("%JUDGESTATUS",judgemode.queryStatus()?"<font color=green>在线</font>":"<font color=grey>离线</font>"));
		database.getStatus(req.query.down,req.query.top,req.query.ai1,req.query.ai2,function(status){
			if(!(status instanceof Array)){
				error(req,res,"数据库错误:" + status);
				return;
			}
			var i;
			if(req.query.down!=-1){
				s=status.length-1;
			}else{
				s=Math.min(20,status.length);
			}
			for(i=0;i<s;i++){
				var ai1=database.getAIbyID(status[i].Aid);
				var ai2=database.getAIbyID(status[i].Bid);
				var showlog;
				if(status[i].result==-1){
					showlog="";
				}else{
					showlog='<a href="log?id=%ID">下载</a>'.replace("%ID",status[i].id);
				}
				html.push(replace(statusbodyhtml,["%ROWSTYLE","%ID","%USER1","%AI1","%USER2","%AI2","%INFO","%TIME","%USERID1","%USERID2","%AIID1","%AIID2","%LOG"],
					[(i&1)?"ODDROW":"EVENROW",status[i].id,ai1.user.username,ai1.AIname,ai2.user.username,ai2.AIname,status[i].resultInfo,date2str(status[i].time),ai1.user.id,ai2.user.id,ai1.id,ai2.id,showlog]));
			}
			html.push("</table>");
			if(s==0){
				html.push("无记录。<br>");
			}
			
			
			html.push("<a href=status?" + limit.substring(0,limit.length) + ">首页</a>&nbsp;&nbsp;");
			if(status.length>0){
				if(!(req.query.down!=-1 && status.length<=20) && !(req.query.down==-1 && req.query.top==-1)){
					html.push("<a href=status?" + limit + "down=%DOWNID>上一页</a>&nbsp;&nbsp;".replace("%DOWNID",status[0].id));
				}
				if(!(req.query.down==-1 && status.length<=20)){
					html.push("<a href=status?" + limit + "top=%TOPID>下一页</a>".replace("%TOPID",status[s].id+1));
				}
				//html.push(replace(status2html,["%DOWNID","%TOPID"],[]);
			}
			html.push("</center><br>");
			html.push(gettail(req));
			res.send(html.join(""));
		});
	};
}

function userinfoP()
{
	userinfo1html = multiString(function() {
		/*
		<title>用户详细信息--%USERNAME</title>
		<center>
			<table width=70%>
				<caption>%USERNAME</caption>
				<tr bgcolor=#D7EBFF>
					<td width=20%>排名
					<td width=30% align=center>%RANK
					<td width=20%>得分
					<td width=30% align=center>%SCORE
				</tr>
				<tr bgcolor=#D7EBFF>
					<td>历史AI总数
					<td align=center>%ALLAINUM
					<td>公开AI总数
					<td align=center>%PUBLICAINUM
				</tr>
				<tr bgcolor=#D7EBFF>
					<td>总对战数
					<td align=center>%ALLSTATUSNUM
					<td>总胜场
					<td align=center>%WINSTATUSNUM
				</tr>
				<tr bgcolor=#D7EBFF>
					<td>总对战AI数
					<td align=center>%ALLOPNUM
					<td>总均胜场数
					<td align=center>%WINOPNUM
				</tr>
				<tr bgcolor=#D7EBFF>
					<td>胜率
					<td align=center>%WINNING
					<td>Email
					<td align=center>%EMAIL

				</tr>
				<tr bgcolor=#D7EBFF>
					<td>个性签名
					<td colspan=3 align=center>%MOTTO
				</tr>
				<tr bgcolor=#D7EBFF>
					<td colspan=4> 所有公开AI(总数:%PUBLICAINUM)
				</tr>
		*/
	});
	userinfo2html = multiString(function() {
		/*
				</table>
			</center>
			﻿<br>
		*/
	});
	userinfobodyhtml = multiString(function() {
		/*
			<tr bgcolor=#D7EBFF align=center>
				<td> bot1
				<td> 排名:1&nbsp;&nbsp;得分:score1
				<td> bot2
				<td> 排名:1&nbsp;&nbsp;得分:score1
			</tr>
			<tr bgcolor=#D7EBFF align=center>
				<td> bot3
				<td> 排名:1&nbsp;&nbsp;得分:score1
				<td> bot4
				<td> 排名:1&nbsp;&nbsp;得分:score1
			</tr>
		*/
	});
	return function(req,res) {
		if(typeof(req.query.id)=='undefined' || !req.query.id.match(/^[0-9]+$/)){
			res.redirect("../");
			return;
		}
		var user = database.getUserbyID(req.query.id),i;
		if(typeof(user)=="undefined"){
			notfound(req,res,"无效的ID。");
			return;
		}
		var html = [];
		html.push(gethead(req));
		html.push(replace(userinfo1html,
			["%USERNAME","%RANK","%SCORE","%ALLAINUM","%PUBLICAINUM","%ALLSTATUSNUM","%WINSTATUSNUM","%WINOPNUM","%WINNING","%EMAIL","%MOTTO","%PUBLICAINUM","%ALLOPNUM"],
			[user.username,user.rank,user.score.toFixed(2),user.allAI.length,user.publicAI.length,user.allStatusNum,user.winStatusNum.toFixed(2),user.winOPnum.toFixed(2),(user.winOPnum/user.allOPnum*100).toFixed(2)+"%",user.email,user.motto,user.publicAI.length,user.allOPnum]));
		for(i=0;i<user.publicAI.length;i++){
			html.push("<tr bgcolor=#D7EBFF align=center>\n");
			html.push("<td> <a href='AIinfo?id=" + user.publicAI[i].id + "'>" + user.publicAI[i].AIname);
			html.push("<td> 排名:" + user.publicAI[i].rank + "&nbsp;&nbsp;得分:" + user.publicAI[i].score.toFixed(2) + "\n");
			i++;
			if(i<user.publicAI.length){
				html.push("<td> <a href='AIinfo?id=" + user.publicAI[i].id + "'>" + user.publicAI[i].AIname);
				html.push("<td> 排名:" + user.publicAI[i].rank + "&nbsp;&nbsp;得分:" + user.publicAI[i].score.toFixed(2) + "\n");
			}else{
				html.push("<td><td>\n");
			}
		}
		html.push(userinfo2html);
		html.push(gettail(req));
		res.send(html.join(""));
	};
}

function AIinfoP()
{
	AIinfo1html = multiString(function() {
		/*
		<title>AI详细信息--%AINAME</title>
		<center>
			<table width=70%>
				<caption>%AINAME</caption>
				<tr bgcolor=#D7EBFF>
					<td width=20%>排名
					<td width=30% align=center>%RANK
					<td width=20%>得分
					<td width=30% align=center>%SCORE
				</tr>
				<tr bgcolor=#D7EBFF>
					<td>用户名
					<td align=center><a href="userinfo?id=%USERID">%USERNAME
					<td>模式
					<td align=center>%TYPE
				</tr>
				<tr bgcolor=#D7EBFF>
					<td>对战次数
					<td align=center>%ALLSTATUSNUM
					<td>获胜次数
					<td align=center>%WINSTATUSNUM
				</tr>
				<tr bgcolor=#D7EBFF>
					<td>对战AI数 
					<td align=center>%ALLOPNUM
					<td>均胜场数
					<td align=center>%WINOPNUM
				</tr>
				<tr bgcolor=#D7EBFF>
					<td>胜率
					<td align=center>%WINNING
					<td>
					<td>
				</tr>
			</table>
		*/
	});
	return function(req,res) {
		if(typeof(req.query.id)=='undefined' || !req.query.id.match(/^[0-9]+$/)){
			res.redirect("../");
			return;
		}
		var AI = database.getAIbyID(req.query.id),i;
		if(typeof(AI)=="undefined"){
			notfound(req,res,"无效的ID。");
			return;
		}
		var html = [];
		html.push(gethead(req));
		html.push(replace(AIinfo1html,
			["%AINAME","%RANK","%SCORE","%USERID","%USERNAME","%TYPE","%ALLSTATUSNUM","%WINSTATUSNUM","%ALLOPNUM","%WINOPNUM","%WINNING","%AIID"],
			[AI.AIname,AI.rank,AI.score.toFixed(2),AI.userid,AI.user.username,AITYPE[AI.type],AI.allStatusNum,AI.winStatusNum.toFixed(2),AI.allOPnum,AI.winOPnum.toFixed(2),(AI.winOPnum/AI.allOPnum*100).toFixed(2)+"%",AI.id]
		));
		html.push('<a href="status?ai1=%AIID">查看所有记录</a><br>'.replace("%AIID",AI.id));
		if((typeof(req.session.userid)!="undefined" && req.session.userid==AI.user.id) || AI.type==1){
			html.push('<a href="battle?op=%AIID">我要与其对战</a><br>'.replace("%AIID",AI.id));
		}
		if(typeof(req.session.userid)!="undefined" && AI.user.id == req.session.userid){
			html.push('<a href="sourcecode?id=%AIID">查看源代码</a>'.replace("%AIID",AI.id));
		}
		html.push("</center>﻿<br>");
		html.push(gettail(req));
		res.send(html.join(""));
	};
}

function submitP()
{
	submit1html = multiString(function(){
		/*
		<title>提交AI代码</title>
			<center>
			<script language="Javascript" type="text/javascript" src="edit_area/edit_area_full.js"></script>
			<script language="Javascript" type="text/javascript">

			editAreaLoader.init({
						id: "source"            
						,start_highlight: true 
						,allow_resize: "both"
						,allow_toggle: true
						,word_wrap: true
						,language: "en"
						,syntax: "cpp"  
						,font_size: "8"
						,syntax_selection_allow: "basic,c,cpp,java,pas,perl,php,python,ruby"
						,toolbar: "search, go_to_line, fullscreen, |, undo, redo, |, select_font,syntax_selection,|, change_smooth_selection, highlight, reset_highlight, word_wrap, |, help"          
				});
				function check(field) {
					with(field) {
						if(AIname.value.length < 5 || AIname.value.length > 16) {
							alert("AI名称长度必须在5-16之间。");
							AIname.focus();
							return false;
						}else if(!AIname.value.match(/^[a-zA-Z0-9_]{1,}$/)){
							alert("AI名称必须由大小写字母、数字或下划线组成。");
							AIname.focus();
							return false;
						}else if(language.value<0 || language.value>6){
							alert("请选择一种语言。");
							language.focus();
							return false;
						}else if(source.value.length>65535){
							alert("代码长度不能超过65535字节。");
							source.focus();
							return false;
						}
						return true;
					}
				}
			</script>
			<form action="submit" method="post" onsubmit='return check(this)'>
			<table width="20%">
				<tr class='oddrow'>
					<td width="40%">AI名字:
					<td width="60%"><input style="width:100%" type='text' name="AIname">
				</tr>
				<tr class='evenrow'>
					<td>类型:
					<td><select name="type" style="width:100%">
						<option value=1 selected>public</option>
						<option value=2>private</option>
						</select>
				</tr>
				<tr class='oddrow'>
					<td>语言:
					<td><select id="language" name="language" style="width:100%">
						<option value=-1 selected></option>
						<option value=0>C</option>	<option value=1>C++</option>		<option value=2 >Pascal</option>		<option value=3 >Java</option>		<!--<option value=4 >Ruby</option>		<option value=5 >Bash</option>-->		<option value=6 >Python</option></select>
				</tr>
			</table>
			<br>
			<textarea cols=80 rows=20 id="source" name="source"></textarea>
			<br>

			<input type=submit value="提交">
			</form>
			</center>
			﻿<br>
		*/
	});
	return function(req,res) {
		if(typeof(req.session.username)=='undefined'){
			res.redirect("login");
			return;
		}
		var html = [];
		html.push(gethead(req));
		html.push(submit1html);
		html.push(gettail(req));
		res.send(html.join(""));
	}
}

function submitcheckP()
{
	submitWronghtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('%s');
		history.go(-1);
		</script>
	*/
	});
	return function(req,res) {
		if(typeof(req.session.username)=='undefined'){
			res.redirect("login");
			return;
		}
		if(req.body.AIname.length < 5 || req.body.AIname.length > 16) {
			res.send(submitWronghtml.replace("%s","AI名称长度必须在5-16之间。"));
		}else if(!req.body.AIname.match(/^[a-zA-Z0-9_]{1,}$/)){
			res.send(submitWronghtml.replace("%s","AI名称必须由大小写字母、数字或下划线组成。"));
		}else if(req.body.language.value<0 || req.body.language.value>6){
			res.send(submitWronghtml.replace("%s","请选择一种语言。"));
		}else if(req.body.source.length>65535){
			res.send(submitWronghtml.replace("%s","代码长度不能超过65535字节。"));
		}else{
			database.submitAI(req.session.userid,req.body.AIname,req.body.type,req.body.language,req.body.source,function(err)
			{
				if(err){
					error(req,res,"数据库错误:" + err);
					return;
				}
				res.redirect("battle");
			});
		}
	}
}
function battlecheckP()
{
	battleWronghtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('%s');
		history.go(-1);
		</script>
	*/
	});
	battleConfirmhtml = multiString(function() {
	/*
		 	<form name="hidden_form" action="battle?confirm=true" method="post">
				<input type="hidden" name="player1" value="%PLAYER1"> 
				<input type="hidden" name="player2" value="%PLAYER2"> 
			</form>
		<script language='javascript'>
		if(confirm('该对战已经测评过。点击确定重新测评，点击取消转到测评结果。')){
			document.getElementsByName('hidden_form')[0].submit();
		}else{
			location.href="status?ai1=%PLAYER1&&ai2=%PLAYER2";
		}
		</script>
	*/


	});
	return function(req,res) {
		if(typeof(req.session.username)=='undefined'){
			res.redirect("login");
			return;
		}
		if(req.body.player1=="" || req.body.player2==""){
			res.send(submitWronghtml.replace("%s","请选择AI。"));
		}else{
			if(typeof(req.query.confirm)=='undefined'){
				database.findbattle(req.body.player1,req.body.player2,function(err,id){
					if(err){
						error(req,res,"数据库错误:" + err);
						return;
					}
					if(typeof(id)!="undefined"){
						res.send(replace(battleConfirmhtml,["%PLAYER1","%PLAYER2"],[req.body.player1,req.body.player2]));
					}else{
						sendbattle();
					}
				});
			}else{
				sendbattle();
			}
			function sendbattle(){
				database.battle(req.body.player1,req.body.player2,function(err){
					if(err){
						error(req,res,"数据库错误:" + err);
						return;
					}
					res.redirect("status");
				});
			}
		}
	}
}
function contestP()
{
	contest1html = multiString(function() {
		/*
		<title>比赛列表</title>
		<center>
			<table width=90%>
				<tr class='toprow'>
					<td width=10% align=center><b>ID</b>
					<td width=30% align=center><b>比赛名</b>
					<td width=30% align=center><b>开始时间<b>
					<td width=10% align=center><b>参赛AI数</b>
					<td width=20% align=center><b>状态</b>
				</tr>
		*/
	});
	contestContenthtml = multiString(function() {
		/*
			<tr class='%ROWSTYLE'>
				<td align=center>%CID
				<td align=center><a href='contestinfo?id=%ID'>%NAME</a>
				<td align=center>%TIME
				<td align=center>%NUM
				<td align=center>%STATUS
			</tr>
		*/
	});	
	contest2html = multiString(function() {
		/*
					<tr>
						<td colspan=2 align=left>
							<form action="AIrank" method="get">
								转到第<input name="page" size="1" value="%NOWPAGE">页(共%PAGENUM页)
								<input type=submit value=Go>
							</form>
						</td>
						<td colspan=2 align=right>
		*/
	});
	contest3html = multiString(function() {
		/*
						</td>
					</tr>
				</table>
			</center>
		*/
	});
	
	return function(req,res){
		if(typeof(req.query.page)=='undefined' || !req.query.page.match(/^[0-9]+$/) || req.query.page<1)
			req.query.page=1;
		else
			req.query.page=parseInt(req.query.page);
		var ListPerPage = 10;
		var html = [];
		html.push(gethead(req));
		html.push(contest1html);
		var contest=database.getContest(),i;
		var s=(req.query.page-1)*ListPerPage,t=Math.min(s+ListPerPage,contest.length);
		var status = ["<font color=green>暂停中</font>","<font color=green>报名中</font>","<font color=orange>评测中</font>","<font color=red>已结束</font>"];

		
		if(contest.length>=3){
			var i=contest.length-3;
			html.push(replace(contestContenthtml,
			["%ROWSTYLE","%CID","%ID","%NAME","%STATUS","%NUM","%TIME"],
			[(s&1)?"EVENROW":"ODDROW","置顶",contest[i].id,contest[i]._name,status[contest[i].result+2],contest[i].ai.length,date2str	(contest[i].time)]));
		}
		for(i=s;i<t;i++){
			html.push(replace(contestContenthtml,
			["%ROWSTYLE","%CID","%ID","%NAME","%STATUS","%NUM","%TIME"],
			[(i&1)?"ODDROW":"EVENROW",contest[i].id,contest[i].id,contest[i]._name,status[contest[i].result+2],contest[i].ai.length,date2str(contest[i].time)]));
		}
		
		html.push(replace(contest2html,
			["%NOWPAGE","%PAGENUM"],[req.query.page,Math.floor(contest.length/ListPerPage)+1]));
		if(req.query.page!=1){
			html.push('<a href="contest">首页</a>\n');
			html.push('<a href="contest?page=' + (req.query.page-1) + '">上一页</a>\n');
		}
		if(req.query.page<Math.floor(contest.length/ListPerPage)+1){
			html.push('<a href="contest?page=' + (req.query.page+1) + '">下一页</a>\n');
			html.push('<a href="contest?page=' + Math.floor(contest.length/ListPerPage+1) + '">末页</a>\n');
		}
		html.push(contest3html);
		html.push(gettail(req));
		res.send(html.join(""));
	}
}
function helpP()
{
	helphtml = multiString(function() {
		/*
		<title>帮助</title>
<center>
<table width=90%>
<tr class="TOPROW"><td colspan=2 align=center>帮助
<tr><td><br><td>
<tr class="ODDROW"><td>Q: <td>系统评测环境。
<tr valign="top"><td>A:	<td>评测在Linux下进行，C/C++代码请使用cin、cout或%lld来输入输出64位整数。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:	<td>各语言的编译(运行)命令。
<tr valign="top"><td>A:  <td>
	<table>
	<tr><td width=20%>C编译命令:	<td>gcc Main.c -O2 -o Main -Wall -lm --static --std=c99 -DONLINE_JUDGE
	<tr><td>C++编译命令:	<td>g++ Main.cc -O2 -o Main -Wall -lm --static --std=c++0x -DONLINE_JUDGE
    <tr><td>Pascal编译命令:	<td>fpc Main.pas -O2 -Co -Ct -Ci -dONLINE_JUDGE
	<tr><td>Java编译命令:	<td>javac -J-Xms32m -J-Xmx256m Main.java
	<tr><td>Java运行命令:	<td>java -Xms32m -Xmx256m -Djava.security.manager -Djava.security.policy=./java.policy
	<tr><td>Python编译命令: 	<td>python -c import py_compile; py_compile.compile(r'Main.py')
	<tr><td>Python运行命令:	<td>python Main.py
	</table>
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>各语言的版本。
<tr valign="top"><td>A:<td>
	gcc 4.6.3<br>
	g++ 4.6.3<br>
	fpc 2.4.4-3.1<br>
	javac 1.7.0_55<br>
	python 2.7.3<br>
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>各资源的限制为多少？
<tr valign="top"><td>A:<td>编译时间不得超过20s;前x回合用户时间不得超过0.1s*x;每回合真实时间不得超过10s;总时间不得超过200s;内存大小不得超过512M;堆栈大小不得超过512M。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>评测各个状态的显示是什么意思？
<tr valign="top"><td>A:<td>
	<table>
	<tr><td width=20%><font color=grey>Pending</font>：<td>战斗等待评测中。
	<tr><td><font color=blue>Compile Error</font>：<td>编译错误/编译超时。错误信息可以在客户端平台上看到，本次战斗不计入得分。
	<tr><td><font color=blue>Compiled</font>：<td>编译成功。你的对手编译失败了，本次战斗不计入得分。
	<tr><td><font color=red>Time Limit Exceeded</font>：<td>运行超时。可能原因有：输出文件不完整导致评测机等待输出而超时；前x回合用户时间超过0.1s*x;每回合真实时间超过10s;总时间超过200s。
	<tr><td><font color=red>Memory Limit Exceeded</font>：<td>内存超出限制。运行内存超过512M。
	<tr><td><font color=red>Output Limit Exceeded</font>：<td>输出过长。可能原因有：向标准错误输出内输入过多信息。
	<tr><td><font color=red>Invalid Output</font>：<td>输出不合法。可能原因有：输出不符合格式；操作违反规则。错误信息可以在客户端平台上看到。
	<tr><td><font color=red>Input Exceeded</font>：<td>输入堵塞。可能原因有：每回合没有将输入读完，导致输入堵塞。
	<tr><td><font color=red>Runtime Error</font>：<td>运行时错误。可能原因有：程序退出；非法系统调用；访问非法内存；各种其他原因。
	<tr><td><font color=green>Normal Operation</font>：<td>运行正常。你的对手因为其他原因失败，本次战斗算你胜利。
	<tr><td><font color=green>HP:XXXX PT:XXXX</font>：<td>战斗正常结束。你胜利了。
	<tr><td><font color=red>HP:XXXX PT:XXXX</font>：<td>战斗正常结束。你失败了。
	<tr><td><font color=orange>HP:XXXX PT:XXXX</font>：<td>战斗正常结束。本次战斗平局。
	</table>
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>为什么我提交的战斗一直在Pending。
<tr valign="top"><td>A:<td>请查看战况页面右侧评测机状态，评测机不是24小时工作的，如果是离线，则请等候评测机上线。<br>
如果评测机已上线，请稍等，评测时间可能需要5分钟。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>战斗的胜利方怎么计算？
<tr valign="top"><td>A:<td>如果双方有一方编译失败，则本次战斗无效，不计入得分。<br>
	如果双方某回合有一方运行错误，则战斗停止。如果双方均运行错误，则平局。否则运行正常的一方获胜。<br>
	如果战斗正常结束，HP为第一关键字，PT为第二关键字，高的一方获胜。<br>
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>AI排名中的得分如何计算？
<tr valign="top"><td>A:<td>AI的参加第一次战斗后有1500的初始分数，打败得分越高的敌人将获得更高的得分，但是多次打败同一个敌人将不会增长分数。为了避免刷分，同一用户AI之间的战斗将不计入得分。得分并不是随时刷新的，根据服务器的运行状态，刷新周期可能为1分钟~60分钟。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>用户排名中的得分如何计算？
<tr valign="top"><td>A:<td>用户的得分将取所有AI中的最大值，包括已删除的AI。得分并不是随时刷新的，根据服务器的运行状态，刷新周期可能为1分钟~60分钟。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>AI的模式是什么意思？
<tr valign="top"><td>A:<td>
	<table>
	<tr><td width=10%>public：<td>你的AI将出现在对战平台的公开AI中，任何人都能挑战你的AI。其他人无法看到该AI的源代码。
	<tr><td>private：<td>你的AI将只出现在对战平台的“我的AI”中，只有你才能发起这个AI的战斗。
	<tr><td>deleted：<td>该AI已删除，将不出现在对战平台内，任何人无法发起他的战斗。但数据保留，你仍可以查看该AI的源代码。
	</table>
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>private模式的AI对战LOG也会被公开吗？
<tr valign="top"><td>A:<td>是的。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>我在网站上提交的AI源代码会公开吗？
<tr valign="top"><td>A:<td>不会，只有你登录后才能看到你AI的源代码。如果以后有公开代码活动，我们会征求用户同意。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>将AI设为public模式将有什么好处？
<tr valign="top"><td>A:<td>你的源代码不会公开。<br>
任何人都可以挑战你的AI，也就是可能可以和其他private的AI进行对战，便于你更好的编写AI。<br>
将促使整个游戏良性发展。<br>
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>AI信息中的各项信息是什么意思？
<tr valign="top"><td>A:<td>
<table>
<tr><td width=20%>排名：<td>有得分计算的AI排名。
<tr><td>得分：<td>通过战斗取得的分数，评判AI强度的一定标准。
<tr><td>用户名：<td>拥有者的用户名。
<tr><td>模式：<td>AI的模式，本页面其他地方有详细介绍。
<tr><td>对战次数：<td>总战斗数。双方是同一AI将不计入。
<tr><td>获胜次数：<td>获胜的战斗次数。平局算0.5胜。双方是同一AI将不计入。
<tr><td>对战AI数：<td>与相同AI的战斗将不计多次。双方是同一AI将不计入。
<tr><td>均胜场数：<td>与所有AI的战斗胜率之和。双方是同一AI将不计入。
<tr><td>胜率：<td>对战AI数/均胜场数。
</table>
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>用户信息中的各项信息是什么意思？
<tr valign="top"><td>A:<td>
<table>
<tr><td width=20%>排名：<td>有得分计算的用户排名。
<tr><td>得分：<td>该用户拥有AI的得分最大值，评判用户AI强度的一定标准。
<tr><td>历史AI总数：<td>包括删除AI的所有AI数量。
<tr><td>公开AI总数：<td>公开的AI数量。
<tr><td>总对战次数：<td>该用户AI战斗数之和。
<tr><td>总胜场：<td>该用户AI获胜战斗数之和。
<tr><td>总对战AI数：<td>该用户所有AI的对战AI数之和。
<tr><td>总均胜场数：<td>该用户所有AI的均胜场数之和。
<tr><td>胜率：<td>总对战AI数/总均胜场数。
<tr><td>Email：<td>选填。
<tr><td>个性签名：<td>选填。
<tr><td>所有公开AI：<td>可以在这里找到该用户所有公开AI。
</table>
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>LOG文件怎么查看？
<tr valign="top"><td>A:<td>请使用发布的客户端平台，gz文件不需要解压。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>比赛的赛制是什么?
<tr valign="top"><td>A:<td>赛制为瑞士轮，具体操作是这样的：<br>
设参加人数为n，比赛轮数为2*ceil(log(n))-1，但不得超过n-1。<br>
初始时每位选手得分为0。<br>
每一轮开始时将以得分为第一关键字，所有已交战对手的得分和为第二关键字，从大到小进行排序，如果相同顺序随机。<br>
接下来将进行n/2场战斗，将尽量安排排位相近的选手进行对战，并且尽量不使已交战过的选手进行对战。<br>
一场战斗，胜者得3分，平局双方各得1分，败者不得分。<br>
所有轮数进行完后，同样按得分为第一关键字，所有已交战对手的得分和为第二关键字，从大到小进行排序。这个顺序即为最后的排名。<br>
如果是正式比赛，且最后仍有两个关键字均相同的选手，将对这两位选手进行加赛。<br>
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>比赛过程的界面是什么意思。
<tr valign="top"><td>A:<td>左端是RunID，点击可以跳转到战况页面。右侧为交战选手，绿色的为胜者，红色的为败者，橙色为平局。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>我发现了bug。
<tr valign="top"><td>A:<td>请在发布帖回复。或联系hzhwcmhf或vfleaking。
<tr><td><br><td>
<tr class="ODDROW"><td>Q:<td>我还有其他想问的。
<tr valign="top"><td>A:<td>请在发布帖回复。或联系hzhwcmhf或vfleaking。
</table>
</center>
*/
	});
	return function(req,res) {
		var html = [];
		html.push(gethead(req));
		html.push(helphtml);
		html.push(gettail(req));
		res.send(html.join(""));
	}
}
function deleteAIP()
{
	var deleteAIWronghtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('%s');
		history.go(-1);
		</script>
	*/
	});
	return function(req,res) {
		if(typeof(req.query.id)=="undefined" || !req.query.id.match(/^[0-9]+$/)){
			res.redirect("../");
			return;
		}
		if(typeof(req.session.username)=='undefined'){
			res.redirect("login");
			return;
		}
		var ai = database.getAIbyID(req.query.id);
		if(ai.user.id!=req.session.userid){
			res.send(deleteAIWronghtml.replace("%s","你没有权限操作这个AI。"));
			return;
		}
		if(ai.type==3){
			res.send(deleteAIWronghtml.replace("%s","该AI已删除。"));
			return;
		}
		database.deleteAI(req.query.id,function(err){
			if(err){
				error(req,res,"数据库错误:" + err);
				return;
			}
			
			res.redirect("battle");
		});
	}
}
function sourcecodeP()
{
	var sourcecode1html=multiString(function(){
		/*
			<title>查看源代码--%AINAME</title>
			<link href='highlight/styles/shCore.css' rel='stylesheet' type='text/css'/> 
			<link href='highlight/styles/shThemeDefault.css' rel='stylesheet' type='text/css'/> 
			<script src='highlight/scripts/shCore.js' type='text/javascript'></script> 
			<script src='highlight/scripts/shBrushCpp.js' type='text/javascript'></script> 
			<script src='highlight/scripts/shBrushCSharp.js' type='text/javascript'></script> 
			<script src='highlight/scripts/shBrushCss.js' type='text/javascript'></script> 
			<script src='highlight/scripts/shBrushJava.js' type='text/javascript'></script> 
			<script src='highlight/scripts/shBrushDelphi.js' type='text/javascript'></script> 
			<script src='highlight/scripts/shBrushRuby.js' type='text/javascript'></script> 
			<script src='highlight/scripts/shBrushBash.js' type='text/javascript'></script>
			<script src='highlight/scripts/shBrushPython.js' type='text/javascript'></script> 
			<script language='javascript'> 
			SyntaxHighlighter.config.bloggerMode = false;
			SyntaxHighlighter.config.clipboardSwf = 'highlight/scripts/clipboard.swf';
			SyntaxHighlighter.all();
			</script>
			<pre class="brush:%BRUSH;">
/**************************************************************
Username: %USERNAME
Language: %LANGUAGE
AIname:	  %AINAME
****************************************************************/
	});
	var sourcecode2html=multiString(function(){
		/*</pre>﻿<br>*/
	});
	sourcecodeWronghtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('%s');
		history.go(-1);
		</script>
	*/
	});
	var BRUSH = ["c++","c++","pascal","java","ruby","bash","python"];
	return function(req,res){
		if(typeof(req.query.id)=="undefined" || !req.query.id.match(/^[0-9]+$/) || typeof(req.session.username)=="undefined"){
			res.redirect("../");
			return;
		}
		var ai = database.getAIbyID(req.query.id);
		if(ai.user.id!=req.session.userid){
			res.send(sourcecodeWronghtml.replace("%s","你没有权限操作这个AI。"));
			return;
		}
		var html = [];
		html.push(gethead(req));
		database.getSourcecode(req.query.id,function(language,sourcecode){
			if(typeof(language)!="number"){
				error(req,res,"数据库错误:" + language);
				return;
			}
			html.push(replace(sourcecode1html,["%AINAME","%USERNAME","%LANGUAGE","%BRUSH"],[ai.AIname,ai.user.username,LANGUAGE[language],BRUSH[language]]));
			html.push("/\n");
			html.push(txtTohtmlSingle(sourcecode));
			html.push(sourcecode2html);
			html.push(gettail(req));
			res.send(html.join(""));
		});
	}
}
function errorP()
{
	var errorhtml = multiString(function() {
	/*
		<title>500 数据库访问出错</title>
		<center>
		<table width=90%>
			<tr class="evenrow"> 
				<td colspan=2 align=center><font color=black size=24>500 数据库访问出错。</font>
			<tr class="oddrow">
				<td width=10%>出错地址
				<td width=90%>%FROM
			<tr class="evenrow"> 
				<td>出错原因
				<td style="white-space:normal">%ERROR
			<tr class="oddrow">
				<td>解决办法
				<td>1.网站基于百度BAE，有可能是百度的数据库暂时抽筋了，请重试操作。<br>2.如果重试仍不行，可能是长时间抽筋，请等一会儿重试操作。<br>3.如果过了一段时间还是不行，请保存此页面，记住你刚才的操作，联系管理员，百度ID:hzhwcmhf。
		</table>
		</center>
	*/
	});
	return function(req,res,err){
		if(typeof(err)!="string"){
			err = "未知原因。";
		}
		res.status(500);
		var html=[];
		html.push(gethead(req));
		html.push(replace(errorhtml,["%FROM","%ERROR"],[req.originalUrl,err]));
		html.push(gettail(req));
		res.send(html.join(""));
	}
}
function logP()
{
	return function(req,res){
		if(typeof(req.query.id)=="undefined" || !req.query.id.match(/^[0-9]+$/)){
			res.redirect("../status");
			return;
		}
		database.getLog(req.query.id,function(log){
			if(typeof(log)=="undefined"){
				notfound(req,res,"id号不存在。")
				return;
			}
			if(log instanceof Error){
				error(req,res,"数据库错误:" + log);
				return;
			}
			if(log==null){
				notfound(req,res,"无效的log。");
				return;
			}
			res.type("application/x-gzip-compressed");
			res.attachment(req.query.id+".gz");
			res.send(log);
		});
	}
}

function notfoundP()
{
	var errorhtml = multiString(function() {
	/*
		<title>404 Not Found</title>
		<center>
		<table width=90%>
			<tr class="evenrow"> 
				<td colspan=2 align=center><font color=black size=24>404 Not Found</font>
			<tr class="oddrow">
				<td width=10%>出错地址
				<td width=90%>%FROM
			<tr class="evenrow"> 
				<td>出错原因
				<td style="white-space:normal">%ERROR
			<tr class="oddrow">
				<td>解决办法
				<td>1.如果你是从站外链接进入，说明该页面已被删除，请不要再次访问。<br>2.如果是从站内链接进入，请保存此页面，记住你刚才的操作，联系管理员，百度ID:hzhwcmhf。
		</table>
		</center>
	*/
	});
	return function(req,res,err){
		if(typeof(err)!="string"){
			err = "该页面不存在。";
		}
		//console.log("????");
		res.status(404);
		var html=[];
		html.push(gethead(req));
		html.push(replace(errorhtml,["%FROM","%ERROR"],[req.originalUrl,err]));
		html.push(gettail(req));
		res.send(html.join(""));
	}
}


function isAdmin(username)
{
	return username == "hzhwcmhf" || username == "vfleaking";
}

function modifynoticeP()
{
	var modifyNoticeHtml = multiString(function() {
	/*
		<title>修改公告</title>
		<center>
		<form action="modifyNotice" method=post>
		<table width=90%>
			<tr><td>修改为:<textarea name="notice" cols=100>%NOTICE</textarea>
			<tr><td><input value="提交" name="submit" type="submit">
		</table>
		</form>
		</center>
	*/
	});
	return function(req,res){
		if(!isAdmin(req.session.username)){
			notfound(req,res);
			return;
		}
		var html=[];
		html.push(gethead(req));
		html.push(replace(modifyNoticeHtml,["%NOTICE"],[htmlTotxt(noticeHtml)]));
		html.push(gettail(req));
		res.send(html.join(""));
	}
}
function modifynoticecheckP()
{
	var modifyNoticeCheckHtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('操作成功。');
		history.go(-1);
		</script>
	*/
	});
	return function(req,res){
		if(!isAdmin(req.session.username)){
			notfound(req,res);
			return;
		}
		noticeHtml = txtTohtml(req.body.notice);
		res.send(modifyNoticeCheckHtml);
	}
}
function createcontestP()
{
	var createContestHtml = multiString(function() {
	/*
		<title>增加比赛</title>
		<center>
		<form action="createcontest" method=post>
		<table width=90%>
			<tr><td>比赛名:<input name="_name" type="text" size=50>
			<tr><td>开始时间:<input name="time" type="text" size=32 value="%TIME">
			<tr><td><input value="提交" name="submit" type="submit">
		</table>
		</form>
		</center>
	*/
	});
	return function(req,res){
		if(!isAdmin(req.session.username)){
			notfound(req,res);
			return;
		}
		var html=[];
		html.push(gethead(req));
		html.push(replace(createContestHtml,["%TIME"],[date2str(new Date())]));
		html.push(gettail(req));
		res.send(html.join(""));
	}
}
function createcontestcheckP()
{
	var createContestCheckHtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('%s');
		history.go(-1);
		</script>
	*/
	});
	return function(req,res){
		if(!isAdmin(req.session.username)){
			notfound(req,res);
			return;
		}
		var _name = txtTohtml(req.body._name);
		var time = str2date(req.body.time);
		if(typeof(time)=="undefined"){
			res.send(replace(createContestCheckHtml,["%s"],["日期格式不正确。"]));
			return;
		}
		database.addContest(_name,time,function(err){
			if(err){
				error(req,res,err);
				return;
			}
			res.send(replace(createContestCheckHtml,["%s"],["操作成功。"]));
		});
	}
}
function contestinfoP()
{
	var contestinfo1html = multiString(function() {
		/*
		<title>比赛详细信息--%NAME</title>
		<center>
			<table width=90%>
				<caption>%NAME</caption>
				<tr class="oddrow">
					<td width=20%>现在状态
					<td width=30% align=center>%STATUS
					<td width=20%>开始时间
					<td width=30% align=center>%TIME
				</tr>
			</table>
		*/
	});
	var contestinfotimehtml = multiString(function() {
		/*
		<div id="time" style="font-size:xx-large"></div>
		<script type="text/javascript">
		var time = %DIFFTIME;
		setInterval(function(){
			time -= 1000;
			show(time);
		}, 1000);
		show(time);
		function show(time){
			var element = document.getElementById('time');
			if(time<0){
				element.innerHTML = "比赛已经开始";
				return;
			}
			time = Math.floor(time/1000);
			var second = time%60;
			time = Math.floor(time/60);
			var minute = time%60;
			time = Math.floor(time/60);
			var hour = time%24;
			time = Math.floor(time/24);
			var day = time;
			
			element.innerHTML = "距比赛开始";
			if(day){
				element.innerHTML += day + "天";
			}
			var z ={h:hour,m:minute,s:second};
			element.innerHTML += "hh:mm:ss".replace(/(h+|m+|s+)/g,function(v) {return ((v.length>1?"0":"")+eval('z.'+v.slice(-1))).slice(-(v.length>2?v.length:2))});
		}
		
		</script>
		*/
	});
	var contestinfo1_1html = multiString(function() {
		/*
			<br></br>
			<hr width="90%" style="border:1px solid #1a5cc8;"></hr>
			<table width=90%>
				<caption>所有参赛AI：(共%NUM个)</caption>
				<tr class="toprow">
					<td width=10%>排名
					<td width=20%>用户
					<td width=20%>AI
					<td width=25%>得分
					<td width=25%>交战对手得分
				</tr>
		*/
	});
	var contestinfo2html = multiString(function() {
		/*
			</table>
			<br></br>
			<hr width="90%" style="border:1px solid #1a5cc8;"></hr>
			<form action="contestinfo?id=%CONTESTID" method="post">
			<table width=90%>
				<tr>
				<td width=10%>我的参战AI
				<td width=30%><select style="width:80%" name="ai">
		*/
	});
	var contestinfo3html = multiString(function() {
		/*
				</select>	
				<td> <input value="提交" name="submit" type="submit">
			</table>
			</form>
		</center>
		﻿<br>
		*/
	});
	var contestinfo4html = multiString(function() {
		/*
			</table>
			<br></br>
			<hr width="90%" style="border:1px solid #1a5cc8;"></hr>
			<table width=90%>
				<caption>比赛过程</caption>
				<tr class=toprow>
					<td width=20%><b>RunID</b>
					<td width=20%><b>player1</b>
					<td width=20%><b>AI1</b>
					<td width=20%><b>player2</b>
					<td width=20%><b>AI2</b>
				</tr>
		*/
	});
	var contestinfo5html = multiString(function() {
		/*
			</table>
			</center>
		﻿<br>
		*/
	});
	return function(req,res) {
		if(typeof(req.query.id)=='undefined' || !req.query.id.match(/^[0-9]+$/)){
			res.redirect("../contest");
			return;
		}
		if(typeof(req.session.username)=='undefined'){
			res.redirect("login");
			return;
		}

		var allContest = database.getContest();
		var contest = allContest[allContest.length - req.query.id],i;
		if(typeof(contest)=="undefined"){
			notfound(req,res,"无效的ID。");
			return;
		}
		
		var html = [];
		html.push(gethead(req));
		var status = ["<font color=green>暂停中</font>","<font color=green>报名中</font>","<font color=orange>评测中</font>","<font color=red>已结束</font>"];
		
		html.push(replace(contestinfo1html,
			["%NAME","%STATUS","%TIME"],
			[contest._name,status[contest.result+2],date2str(contest.time)]));
		if(contest.result<0)
			html.push(replace(contestinfotimehtml,["%DIFFTIME"],[contest.time.getTime()-new Date().getTime()-1000]));
		html.push(replace(contestinfo1_1html,
			["%NUM"],
			[contest.ai.length]));
		var myRegisterAI = null;
		for(i=0;i<contest.ai.length;i++){
			var nowai=database.getAIbyID(contest.ai[i].id);
			html.push("<tr class=" + (i&1?"oddrow":"evenrow") + ">\n");
			html.push("<td> " + (i + 1));
			html.push("<td> <a href='userinfo?id=" + nowai.user.id + "'>" + nowai.user.username);
			if(nowai.user.id==req.session.userid){
				myRegisterAI = nowai;
			}
			html.push("<td> <a href='AIinfo?id=" + nowai.id + "'>" + nowai.AIname);
			html.push("<td> " + ((contest.result>=0 || contest.result==-2)?contest.ai[i].score:"-"));
			html.push("<td> " + ((contest.result>=1 || contest.result==-2)?contest.ai[i].OPscore:"-"));
		}

		if(contest.result>=0 || contest.result==-2){
			html.push(contestinfo4html);
			var color=["orange","green","red","orange"];
			for(i=0;i<contest.log.length;i++){
				html.push("<tr class=" + (i&1?"oddrow":"evenrow") + ">\n");
				html.push("<td> <a href='status?top=" + (contest.log[i].id+1) +"'>" + contest.log[i].id);
				var nowai = database.getAIbyID(contest.log[i].ai1);
				html.push("<td> <a href='userinfo?id=" + nowai.user.id + "'><font color=" + color[contest.log[i].result] + ">" + nowai.user.username + "</font>");
				html.push("<td> <a href='AIinfo?id=" + nowai.id + "'><font color=" + color[contest.log[i].result] + ">" + nowai.AIname  + "</font>");
				nowai = database.getAIbyID(contest.log[i].ai2);
				html.push("<td> <a href='userinfo?id=" + nowai.user.id + "'><font color=" + color[3-contest.log[i].result] + ">" + nowai.user.username + "</font>");
				html.push("<td> <a href='AIinfo?id=" + nowai.id + "'><font color=" + color[3-contest.log[i].result] + ">" + nowai.AIname + "</font>");
				html.push("</font>");
			}
			if(!(contest.result==-1 || (contest.result==-2 && myRegisterAI))) html.push(contestinfo5html);
		}
		if(contest.result==-1 || (contest.result==-2 && myRegisterAI)){
			html.push(replace(contestinfo2html,["%CONTESTID"],[req.query.id]));

			var myai = database.getUserbyID(req.session.userid).allAI;
			if(myRegisterAI){
				if(contest.result!=-2)	html.push("<option value='0'>不参赛</option>");
			}else
				html.push("<option value='0' selected>不参赛</option>");
			for(i=0;i<myai.length;i++) if(myai[i].type<=2){
				if(myRegisterAI === myai[i]){
					html.push("<option value='"+ myai[i].id + "' selected>" + myai[i].AIname + "</option>");
				}else{
					html.push("<option value='"+ myai[i].id + "'>" + myai[i].AIname + "</option>");
				}
			}
			html.push(contestinfo3html);
		}
		html.push(gettail(req));
		res.send(html.join(""));
	};
}

function contestinfocheckP()
{
	var contestInfoCheckHtml = multiString(function() {
	/*
		<script language='javascript'>
		alert('%s');
		document.location.href = "contestinfo?id=%ID";
		</script>
	*/
	});
	return function(req,res){
		if(typeof(req.query.id)=='undefined' || !req.query.id.match(/^[0-9]+$/)){
			res.redirect("contest");
			return;
		}
		if(typeof(req.body.ai)=='undefined' || !req.body.ai.match(/^[0-9]+$/)){
			res.redirect("contest");
			return;
		}
		if(typeof(req.session.username)=='undefined'){
			res.redirect("login");
			return;
		}
		var allContest = database.getContest();
		var contest = allContest[allContest.length - req.query.id],i;
		var targetAI = database.getAIbyID(req.body.ai);
		var user = database.getUserbyID(req.session.userid);
		if(typeof(contest)=="undefined" || (req.body.ai !=0 && (typeof(targetAI)=="undefined" || targetAI.user!==user))){
			notfound(req,res,"无效的ID。");
			return;
		}
		if(contest.result >= 0){
			res.send(replace(contestInfoCheckHtml,["%s","%ID"],["比赛已经开始。",req.query.id]));
			return;
		}

		var tmpmark = false;
		for(i=0;i<contest.ai.length;i++){
			var nowai=database.getAIbyID(contest.ai[i].id);
			if(nowai.user === user){
				if(req.body.ai != 0)
					contest.ai[i].id=req.body.ai;
				else contest.ai.splice(i,1);
				tmpmark = true;
				break;
			}
		}
		if(!tmpmark && req.body.ai != 0)contest.ai.push({id:req.body.ai});
		contest.saveContestloop();
		res.send(replace(contestInfoCheckHtml,["%s","%ID"],["操作成功。",req.query.id]));
	};
}
exports.notfound = notfound = notfoundP();
exports.index = indexP();
exports.login = loginP();
exports.logincheck = loginCheckP();
exports.logout = logoutP();
exports.register = registerP();
exports.registercheck = registercheckP();
exports.modifyuser = modifyUserP();
exports.modifyusercheck = modifyUserCheckP();
exports.battle = battleP();
exports.battlecheck = battlecheckP();
exports.userrank = userrankP();
exports.AIrank = AIrankP();
exports.status = statusP();
exports.userinfo = userinfoP();
exports.AIinfo = AIinfoP();
exports.submit = submitP();
exports.submitcheck = submitcheckP();
exports.contest = contestP();
exports.help = helpP();
exports.deleteAI = deleteAIP();
exports.sourcecode = sourcecodeP();
exports.error = error = errorP();
exports.log = logP();
exports.modifynotice = modifynoticeP();
exports.modifynoticecheck = modifynoticecheckP();
exports.createcontest = createcontestP();
exports.createcontestcheck = createcontestcheckP();
exports.contestinfo = contestinfoP();
exports.contestinfocheck = contestinfocheckP();
