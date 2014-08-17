//
// File:   judgeclient.cc
// Author: sempr
// refacted by zhblue
// refacted again by hzhwcmhf
/*
 * Copyright 2008 sempr <iamsempr@gmail.com>
 *
 * Refacted and modified by zhblue<newsclan@gmail.com>
 * Bug report email newsclan@gmail.com
 *
 *
 * This file is part of HUSTOJ.
 *
 * HUSTOJ is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * HUSTOJ is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with HUSTOJ. if not, see <http://www.gnu.org/licenses/>.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <unistd.h>
#include <time.h>
#include <stdarg.h>
#include <ctype.h>
#include <sys/wait.h>
#include <sys/ptrace.h>
#include <sys/types.h>
#include <sys/user.h>
#include <sys/syscall.h>
#include <sys/time.h>
#include <sys/resource.h>
#include <sys/signal.h>
#include <sys/socket.h>
//#include <sys/types.h>
#include <sys/stat.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <assert.h>
#include <iostream>
#include <exception>
#include <fstream>
#include <errno.h>
#include <fcntl.h> 
#include <sstream>
#include "json/json.h"
#include "okcalls.h"
using namespace std;
#include "judger.h"

#ifdef __i386
#define REG_SYSCALL orig_eax
#define REG_RET eax
#define REG_ARG0 ebx
#define REG_ARG1 ecx
#else
#define REG_SYSCALL orig_rax
#define REG_RET rax
#define REG_ARG0 rdi
#define REG_ARG1 rsi
#endif
#define STD_MB 1048576
#define STD_T_LIM 2
#define STD_F_LIM (STD_MB<<5)
#define STD_M_LIM (STD_MB<<7)
#define BUFFER_SIZE 512

//#define DEBUG
string n2s(int num)
{
	char buf[11];
	sprintf(buf,"%d",num);
	return string(buf);
}
int get_proc_status(int pid, const char * mark) {
        FILE * pf;
        char fn[BUFFER_SIZE], buf[BUFFER_SIZE];
        int ret = 0;
        sprintf(fn, "/proc/%d/status", pid);
        pf = fopen(fn, "r");
        int m = strlen(mark);
        while (pf && fgets(buf, BUFFER_SIZE - 1, pf)) {

                buf[strlen(buf) - 1] = 0;
                if (strncmp(buf, mark, m) == 0) {
                        sscanf(buf + m + 1, "%d", &ret);
                }
        }
        if (pf)
                fclose(pf);
        return ret;
}
int get_page_fault_mem(struct rusage & ruse, pid_t & pidApp) {
        //java use pagefault
        int m_minflt;
        m_minflt = ruse.ru_minflt * getpagesize();
        return m_minflt;
}
long get_file_size(const char * filename) {
        struct stat f_stat;

        if (stat(filename, &f_stat) == -1) {
                return 0;
        }

        return (long) f_stat.st_size;
}
int execute_cmd(const char * fmt, ...) {
        char cmd[BUFFER_SIZE];

        int ret = 0;
        va_list ap;

        va_start(ap, fmt);
        vsprintf(cmd, fmt, ap);
        ret = system(cmd);
        va_end(ap);
        return ret;
}
void copy_shell_runtime(const char * work_dir) {


        execute_cmd("mkdir %s/lib", work_dir);
        execute_cmd("mkdir %s/lib64", work_dir);
        execute_cmd("mkdir %s/bin", work_dir);
        execute_cmd("cp /lib/* %s/lib/", work_dir);
        execute_cmd("cp -a /lib/i386-linux-gnu %s/lib/", work_dir);
        execute_cmd("cp -a /lib/x86_64-linux-gnu %s/lib/", work_dir);
        execute_cmd("cp /lib64/* %s/lib64/", work_dir);
        execute_cmd("cp -a /lib32 %s/", work_dir);
        execute_cmd("cp /bin/busybox %s/bin/", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/sh", work_dir);
        execute_cmd("cp /bin/bash %s/bin/bash", work_dir);


}
void copy_objc_runtime(const char * work_dir){
      copy_shell_runtime(work_dir);
        execute_cmd("mkdir -p %s/proc",work_dir);
        execute_cmd("mount -o bind /proc %s/proc", work_dir);
	    execute_cmd("mkdir -p %s/lib/",work_dir);
execute_cmd("cp -aL /lib/libdbus-1.so.3                          %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/libgcc_s.so.1                           %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/libgcrypt.so.11                         %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/libgpg-error.so.0                       %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/libz.so.1                               %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/tls/i686/cmov/libc.so.6                 %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/tls/i686/cmov/libdl.so.2                %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/tls/i686/cmov/libm.so.6                 %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/tls/i686/cmov/libnsl.so.1               %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/tls/i686/cmov/libpthread.so.0           %s/lib/ ", work_dir);   
execute_cmd("cp -aL /lib/tls/i686/cmov/librt.so.1                %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libavahi-client.so.3                %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libavahi-common.so.3                %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libdns_sd.so.1                      %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libffi.so.5                         %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libgnustep-base.so.1.19             %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libgnutls.so.26                     %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libobjc.so.2                        %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libtasn1.so.3                       %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libxml2.so.2                        %s/lib/ ", work_dir);   
execute_cmd("cp -aL /usr/lib/libxslt.so.1                        %s/lib/ ", work_dir);    

}
void copy_bash_runtime(const char * work_dir) {
        //char cmd[BUFFER_SIZE];
        //const char * ruby_run="/usr/bin/ruby";
        copy_shell_runtime(work_dir);
        execute_cmd("cp `which bc`  %s/bin/", work_dir);
        execute_cmd("busybox dos2unix Main.sh", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/grep", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/awk", work_dir);
        execute_cmd("cp /bin/sed %s/bin/sed", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/cut", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/sort", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/join", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/wc", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/tr", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/dc", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/dd", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/cat", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/tail", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/head", work_dir);
        execute_cmd("ln -s /bin/busybox %s/bin/xargs", work_dir);
    execute_cmd("chmod +rx %s/Main.sh", work_dir);

}
void copy_ruby_runtime(const char * work_dir) {

        copy_shell_runtime(work_dir);
        execute_cmd("mkdir %s/usr", work_dir);
        execute_cmd("mkdir %s/usr/lib", work_dir);
        execute_cmd("cp /usr/lib/libruby* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/bin/ruby* %s/", work_dir);

}
void copy_python_runtime(const char * work_dir) {

        copy_shell_runtime(work_dir);
        execute_cmd("mkdir -p %s/usr/include", work_dir);
        execute_cmd("mkdir -p %s/usr/lib", work_dir);
        execute_cmd("cp /usr/bin/python* %s/", work_dir);
        execute_cmd("cp -a /usr/lib/python* %s/usr/lib/", work_dir);
        execute_cmd("cp -a /usr/include/python* %s/usr/include/", work_dir);
        execute_cmd("cp -a /usr/lib/libpython* %s/usr/lib/", work_dir);

}
void copy_php_runtime(const char * work_dir) {

        copy_shell_runtime(work_dir);
        execute_cmd("mkdir %s/usr", work_dir);
        execute_cmd("mkdir %s/usr/lib", work_dir);
        execute_cmd("cp /usr/lib/libedit* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/libdb* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/libgssapi_krb5* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/libkrb5* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/libk5crypto* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/*/libedit* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/*/libdb* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/*/libgssapi_krb5* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/*/libkrb5* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/*/libk5crypto* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/lib/libxml2* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/bin/php* %s/", work_dir);
        execute_cmd("chmod +rx %s/Main.php", work_dir);



}
void copy_perl_runtime(const char * work_dir) {

        copy_shell_runtime(work_dir);
        execute_cmd("mkdir %s/usr", work_dir);
        execute_cmd("mkdir %s/usr/lib", work_dir);
        execute_cmd("cp /usr/lib/libperl* %s/usr/lib/", work_dir);
        execute_cmd("cp /usr/bin/perl* %s/", work_dir);

}
void copy_freebasic_runtime(const char * work_dir) {

        copy_shell_runtime(work_dir);
        execute_cmd("mkdir -p %s/usr/local/lib", work_dir);
        execute_cmd("mkdir -p %s/usr/local/bin", work_dir);
        execute_cmd("cp /usr/local/lib/freebasic %s/usr/local/lib/", work_dir);
        execute_cmd("cp /usr/local/bin/fbc %s/", work_dir);
}
void copy_mono_runtime(const char * work_dir) {

        copy_shell_runtime(work_dir);
        execute_cmd("mkdir %s/usr", work_dir);
        execute_cmd("mkdir %s/proc", work_dir);
        execute_cmd("mkdir -p %s/usr/lib/mono/2.0", work_dir);
        execute_cmd("cp -a /usr/lib/mono %s/usr/lib/", work_dir);
        execute_cmd("mkdir -p %s/usr/lib64/mono/2.0", work_dir);
        execute_cmd("cp -a /usr/lib64/mono %s/usr/lib64/", work_dir);

        execute_cmd("cp /usr/lib/libgthread* %s/usr/lib/", work_dir);

        execute_cmd("mount -o bind /proc %s/proc", work_dir);
        execute_cmd("cp /usr/bin/mono* %s/", work_dir);

        execute_cmd("cp /usr/lib/libgthread* %s/usr/lib/", work_dir);
        execute_cmd("cp /lib/libglib* %s/lib/", work_dir);
        execute_cmd("cp /lib/tls/i686/cmov/lib* %s/lib/tls/i686/cmov/", work_dir);
        execute_cmd("cp /lib/libpcre* %s/lib/", work_dir);
        execute_cmd("cp /lib/ld-linux* %s/lib/", work_dir);
        execute_cmd("cp /lib64/ld-linux* %s/lib64/", work_dir);
        execute_cmd("mkdir -p %s/home/judge", work_dir);
        execute_cmd("chown judge %s/home/judge", work_dir);
        execute_cmd("mkdir -p %s/etc", work_dir);
        execute_cmd("grep judge /etc/passwd>%s/etc/passwd", work_dir);
}
const string filename[]={"Main.c","Main.cc","Main.pas","Main.java","Main.rb","Main.sh","Main.py","Main.php","Main.pl","Main.cs","Main.m","Main.bas"};
const int call_array_size=512;

class time_limit_exceeded_error : public myException
{
public:
	virtual string what() const throw()
	{
		return "Time Limit Exceeded";
	}
	virtual string code() const throw()
	{
		return "<font color=red>Time Limit Exceeded</font>";
	}
};
class real_time_limit_exceeded_error : public myException
{
	string usedtime;
public:
	real_time_limit_exceeded_error(string x=""):usedtime(x){	}
	virtual ~real_time_limit_exceeded_error() throw(){}
	virtual string what() const throw()
	{
		return "Time Limit Exceeded(real time exceeded 10s)" + usedtime;
	}
	virtual string code() const throw()
	{
		return "<font color=red>Time Limit Exceeded</font>";
	}
};
class memory_limit_exceeded_error : public myException
{
public:
	virtual string what() const throw()
	{
		return "Memory Limit Exceeded";
	}
	virtual string code() const throw()
	{
		return "<font color=red>Memory Limit Exceeded</font>";
	}
};
class output_limit_exceeded_error : public myException
{
public:
	virtual string what() const throw()
	{
		return "Output Limit Exceeded";
	}
	virtual string code() const throw()
	{
		return "<font color=red>Output Limit Exceeded</font>";
	}
};
class runtime_error_error : public myException
{
	string info;
public:
	runtime_error_error(string x=""):info(x){}
	virtual ~runtime_error_error() throw(){}
	virtual string what() const throw()
	{
		return "Runtime Error" + info;
	}
	virtual string code() const throw()
	{
		return "<font color=red>Runtime Error</font>";
	}
};
class socket_timeout : public exception
{
public:
	virtual const char *what() const throw()
	{
		return "socket_timeout";
	}
};
int nowPid;
void solve(int p)
{
	kill(nowPid,SIGALRM);
}
const int timelimit = 200;
const int memorylimit = 512;
const int filelimit = 100;
struct AI
{
	string dir;
	int id;
	int lang;
	int spid;
	int call_counter[call_array_size];
	int usertime,lasttime;
	FILE *in,*out;
	int AIin,AIout;
	int sub,round;
	AI(const int &id,const string &d,const int &l,const string &sor)
	{
		this->id=id;
		dir=d;
		lang=l;
		spid=-1;
		sub=0;
		usertime=lasttime=0;
		in=out=NULL;
		AIin=AIout=0;
		round = 0;
		#ifndef DEBUG
		int sta = mkdir(d.c_str(),S_IRWXU|S_IRWXG|S_IRWXO);
		if(sta==-1){
			cerr<<"create folder failed"<<endl;
			throw exception();
		}
		ofstream fout((d+"/"+filename[l]).c_str());
		fout<<sor<<endl;
		#endif
	}
	~AI()
	{
		if(in)fclose(in);
		if(out)fclose(out);
		if(AIin)close(AIin);
		if(AIout)close(AIout);
	}
	void init_syscalls_limits() {
        int i;
        memset(call_counter, 0, sizeof(call_counter));
		if (lang <= 1) { // C & C++
                for (i = 0; LANG_CC[i]; i++) {
                        call_counter[LANG_CV[i]] = LANG_CC[i];
                }
        } else if (lang == 2) { // Pascal
                for (i = 0; LANG_PC[i]; i++)
                        call_counter[LANG_PV[i]] = LANG_PC[i];
        } else if (lang == 3) { // Java
                for (i = 0; LANG_JC[i]; i++)
                        call_counter[LANG_JV[i]] = LANG_JC[i];
        } else if (lang == 4) { // Ruby
                for (i = 0; LANG_RC[i]; i++)
                        call_counter[LANG_RV[i]] = LANG_RC[i];
        } else if (lang == 5) { // Bash
                for (i = 0; LANG_BC[i]; i++)
                        call_counter[LANG_BV[i]] = LANG_BC[i];
        }else if (lang == 6) { // Python
                for (i = 0; LANG_YC[i]; i++)
                        call_counter[LANG_YV[i]] = LANG_YC[i];
        }else if (lang == 7) { // php
            for (i = 0; LANG_PHC[i]; i++)
                    call_counter[LANG_PHV[i]] = LANG_PHC[i];
    }else if (lang == 8) { // perl
            for (i = 0; LANG_PLC[i]; i++)
                    call_counter[LANG_PLV[i]] = LANG_PLC[i];
    }else if (lang == 9) { // mono c#
            for (i = 0; LANG_CSC[i]; i++)
                    call_counter[LANG_CSV[i]] = LANG_CSC[i];
    }else if (lang==10){//objective c
	    for (i = 0; LANG_OC[i]; i++)
                    call_counter[LANG_OV[i]] = LANG_OC[i];
    }else if (lang==11){//free basic
	    for (i = 0; LANG_BASICC[i]; i++)
                    call_counter[LANG_BASICV[i]] = LANG_BASICC[i];
    }
}
	int compile()
	{
		if(chdir(dir.c_str())){
			cerr<<"Permission Denied"<<endl;
			throw;
		};
		int pid;
        const char * CP_C[] = { "gcc", "Main.c", "-O2","-o", "Main","-Wall", "-lm",
                        "--static", "-std=c99", "-DONLINE_JUDGE", NULL };
        const char * CP_X[] = { "g++", "Main.cc", "-O2","-o", "Main", "-Wall",
                        "-lm", "--static","-std=c++0x", "-DONLINE_JUDGE", NULL };//ok
        const char * CP_P[] = { "fpc", "Main.pas", "-O2","-Co", "-Ct","-Ci","-dONLINE_JUDGE", NULL };//ok
		const char * CP_J[] = { "javac", "-J-Xms32m", "-J-Xmx256m", "Main.java",NULL };

        const char * CP_R[] = { "ruby", "-c", "Main.rb", NULL };
        const char * CP_B[] = { "chmod", "+rx", "Main.sh", NULL };
        const char * CP_Y[] = { "python","-c","import py_compile; py_compile.compile(r'Main.py')", NULL };//ok
        const char * CP_PH[] = { "php", "-l","Main.php", NULL };
		const char * CP_PL[] = { "perl","-c", "Main.pl", NULL };
		const char * CP_CS[] = { "gmcs","-warn:0", "Main.cs", NULL };
		const char * CP_OC[]={"gcc","-o","Main","Main.m","-fconstant-string-class=NSConstantString","-I","/usr/include/GNUstep/","-L","/usr/lib/GNUstep/Libraries/","-lobjc","-lgnustep-base",NULL};
		const char * CP_BS[]={"fbc","Main.bas",NULL}; 
		
		pid = fork();
        if (pid == 0) {
			struct rlimit LIM;
			LIM.rlim_max = 20;
			LIM.rlim_cur = 20;
			setrlimit(RLIMIT_CPU, &LIM);
			
			LIM.rlim_max = 100 * 1024 * 1024;
			LIM.rlim_cur = 100 * 1024 * 1024;
			setrlimit(RLIMIT_FSIZE, &LIM);

			LIM.rlim_max =  memorylimit *3/2 * 1024 * 1024;
			LIM.rlim_cur =  memorylimit *3/2 * 1024 * 1024;
			setrlimit(RLIMIT_AS, &LIM);
			
			if (lang != 2&& lang != 11) {
				freopen("ce.txt", "w", stderr);
			} else {
				freopen("ce.txt", "w", stdout);
			}
			switch (lang) {
				case 0:
					execvp(CP_C[0], (char * const *) CP_C);
					break;
				case 1:
					execvp(CP_X[0], (char * const *) CP_X);
					break;
				case 2:
					execvp(CP_P[0], (char * const *) CP_P);
					break;
				case 3:
					execvp(CP_J[0], (char * const *) CP_J);
					break;
                case 4:
					execvp(CP_R[0], (char * const *) CP_R);
					break;
                case 5:
					execvp(CP_B[0], (char * const *) CP_B);
					break;
                case 6:
					execvp(CP_Y[0], (char * const *) CP_Y);
					break;
                case 7:
					execvp(CP_PH[0], (char * const *) CP_PH);
					break;
                case 8:
					execvp(CP_PL[0], (char * const *) CP_PL);
					break;
                case 9:
					execvp(CP_CS[0], (char * const *) CP_CS);
					break;
                case 10:
					execvp(CP_OC[0], (char * const *) CP_OC);
					break;
                case 11:
					execvp(CP_BS[0], (char * const *) CP_BS);
					break;
				default:
					printf("nothing to do!\n");
			}
			exit(0);
        } else {
			int status=0;
			waitpid(pid, &status, 0);
			if(lang>3&&lang<7)
				status=get_file_size("ce.txt");
            return status;
        }
	}
	
	void make_runtime()
	{
		init_syscalls_limits();
		if (lang == 4)
			copy_ruby_runtime(dir.c_str());
        if (lang == 5)
			copy_bash_runtime(dir.c_str());
        if (lang == 6)
			copy_python_runtime(dir.c_str());
        if (lang == 7)
			copy_php_runtime(dir.c_str());
        if (lang == 8)
			copy_perl_runtime(dir.c_str());
        if (lang == 9)
			copy_mono_runtime(dir.c_str());
        if (lang == 10)
			copy_objc_runtime(dir.c_str());
        if (lang == 11)
			copy_freebasic_runtime(dir.c_str());
	}
	int run()
	{
		int inpipe[2],outpipe[2];
		pipe(inpipe);
		pipe(outpipe);
		int flags = fcntl(outpipe[0], F_GETFL);
		fcntl(outpipe[0],F_SETFL,flags | O_NONBLOCK);
		flags = fcntl(inpipe[1], F_GETFL);
		fcntl(inpipe[1],F_SETFL,flags | O_NONBLOCK);
		in=fdopen(inpipe[1],"w");
		out=fdopen(outpipe[0],"r");
		
		AIin=inpipe[0];
		AIout=outpipe[1];
		
		int pid = fork();
		if(pid!=0) return spid=pid;
		
		dup2(inpipe[0],0);
		dup2(outpipe[1],1);
		
		
		chdir(dir.c_str());
		ptrace(PTRACE_TRACEME, 0, NULL, NULL);
		if (lang != 3)
			chroot(dir.c_str());
	
		freopen("output.err","w",stderr);
		nice(5);
		while(setgid(1536)!=0) sleep(1);
        while(setuid(1536)!=0) sleep(1);
        while(setresuid(1536, 1536, 1536)!=0) sleep(1);
		
		struct rlimit LIM; 
		// file limit
        LIM.rlim_max = filelimit * STD_MB;
        LIM.rlim_cur = filelimit * STD_MB;
        setrlimit(RLIMIT_FSIZE, &LIM);
		// proc limit
        switch(lang){
			case 3:  //java
				LIM.rlim_cur=LIM.rlim_max=50;
				break;
			case 5: //bash
                LIM.rlim_cur=LIM.rlim_max=3;
                break;
			case 9: //C#
			   LIM.rlim_cur=LIM.rlim_max=30;
			   break;
			default:
				LIM.rlim_cur=LIM.rlim_max=1;
        }
		setrlimit(RLIMIT_NPROC, &LIM);
		//set the stack
		LIM.rlim_cur = STD_MB * memorylimit;
        LIM.rlim_max = STD_MB * memorylimit;
        setrlimit(RLIMIT_STACK, &LIM);
		//set the memory
        LIM.rlim_cur = STD_MB * memorylimit*3/2;
        LIM.rlim_max = STD_MB * memorylimit*2;
        if(lang<3)
			setrlimit(RLIMIT_AS, &LIM);
		
		switch (lang) {
			case 0:
			case 1:
			case 2:
			case 10:
			case 11:
                execl("./Main", "./Main", (char *)NULL);
                break;
			case 3:
                execl("/usr/bin/java", "/usr/bin/java", "-Xms32m","-Xmx256m",
                                "-Djava.security.manager",
                                "-Djava.security.policy=./java.policy", "Main", (char *)NULL);
                break;
			case 4:
                //system("/ruby Main.rb<data.in");
                execl("/ruby","/ruby", "Main.rb", (char *)NULL);
                break;
			case 5: //bash
                execl("/bin/bash","/bin/bash" ,"Main.sh",(char *)NULL);
                break;
			case 6: //Python
                execl("/python","/python","Main.py",(char *)NULL);
                break;
			case 7: //php
                execl("/php","/php","Main.php",(char *)NULL);
                break;
			case 8: //perl
                execl("/perl","/perl","Main.pl",(char *)NULL);
                break;
			case 9: //Mono C#
                execl("/mono","/mono","--debug","Main.exe",(char *)NULL);
			break;
        }
		exit(0);
	}

	ostringstream usedtime;
	void watch()
	{
		int tempmemory;
		int status, sig, exitcode;
		struct user_regs_struct reg;
		struct rusage ruse;
		//while (true) {
			nowPid=spid;
			signal(SIGALRM,solve);
			ptrace(PTRACE_SYSCALL, spid, NULL, NULL);
			alarm(60);
			wait4(spid, &status, 0, &ruse);
			alarm(0);
			
			int nowtime = (ruse.ru_utime.tv_sec * 1000 + ruse.ru_utime.tv_usec / 1000);
			//lasttime=time(0);
			//usedtime << nowtime << " ";
			//cerr<<nowtime<<" "<<100*round<<endl;
			if(nowtime>100 * round){
				throw time_limit_exceeded_error();
			}
			
			
			if (lang == 3) {
				tempmemory = get_page_fault_mem(ruse, spid);
			} else {//other use VmPeak
				tempmemory = get_proc_status(spid, "VmPeak:") << 10;
			}
			if (tempmemory > memorylimit * STD_MB) {
				throw memory_limit_exceeded_error();
			}
			
			if (WIFEXITED(status))
				throw runtime_error_error("EXITED");
			
			exitcode = WEXITSTATUS(status);
			/*exitcode == 5 waiting for next CPU allocation          * ruby using system to run,exit 17 ok
			*  */
			if ((lang >= 3 && exitcode == 17) || exitcode == 0x05 || exitcode == 0)
				//go on and on
				;
			else {
				switch (exitcode) {
					case SIGCHLD:
						throw runtime_error_error("SIGCHLD");
					case SIGKILL:
						throw runtime_error_error("SIGKILL");
					case SIGXCPU:
						throw runtime_error_error("SIGCPU");
					case SIGALRM:
						usedtime << time(0)-lasttime;
						throw real_time_limit_exceeded_error(usedtime.str());
					case SIGXFSZ:
						throw output_limit_exceeded_error();
					default:
						throw runtime_error_error("DEFAULT");
				}
			}
			
			if (WIFSIGNALED(status)) {
				/*  WIFSIGNALED: if the process is terminated by signal
				*
				*  psignal(int sig, char *s)，like perror(char *s)，print out s, with error msg from system of sig  
				* sig = 5 means Trace/breakpoint trap
				* sig = 11 means Segmentation fault
				* sig = 25 means File size limit exceeded
				*/
				sig = WTERMSIG(status);
				switch (sig) {
					case SIGCHLD:
						throw runtime_error_error("SIGCHLD-SIGNAL");
					case SIGALRM:
						throw runtime_error_error("SIGALRM-SIGNAL");
					case SIGKILL:
						throw runtime_error_error("SIGKILL-SIGNAL");
					case SIGXCPU:
						throw real_time_limit_exceeded_error("SIGXCPU-SIGNAL");
					case SIGXFSZ:
						throw output_limit_exceeded_error();
					default:
						throw runtime_error_error("DEFAULT-SIGNAL");
				}
			}
			
			// check the system calls
			ptrace(PTRACE_GETREGS, spid, NULL, &reg);
			if (call_counter[reg.REG_SYSCALL] == 0) { //do not limit JVM syscall for using different JVM
			cerr<<reg.REG_SYSCALL<<endl;
				throw runtime_error_error("INVALID SYSCALL");
			}else{
				if (sub == 1 && call_counter[reg.REG_SYSCALL] > 0)
					call_counter[reg.REG_SYSCALL]--;
			}
			sub = 1 - sub;
			
			
			//lasttime=nowtime;
		//}
	}
};

class Runner:public ProgramChecker
{
public:
	AI* nowAI;
	virtual void check(){
		nowAI->watch();
	}
};

//#define LOCAL
#ifdef LOCAL
const int port = 18081;
const char *ip = "192.168.78.2";
const char *host = "hzhwcmhf.duapp.com";
#else
const int port = 30063;
const char *ip = "111.206.45.12";
const char *host = "hzhwcmhf.duapp.com";
#endif
struct mySocket
{
	int client;
	sockaddr_in serv;
	mySocket(const char* ip,int port)
	{
		serv.sin_family = AF_INET;
		serv.sin_port = htons(port);
		serv.sin_addr.s_addr = inet_addr(ip);
		connect();
	}
	void connect()
	{
		client = socket(AF_INET,SOCK_STREAM,0);
		if(client == -1)
		{
			cerr<<"socket() failed:"<<endl;
			throw socket_timeout();
		}
		if(::connect(client,(struct sockaddr*)&serv,sizeof(serv)) == -1)
		{
			cerr<<"connect() failed:"<<endl;
			throw socket_timeout();
		}
		string req;
		req += "GET /judge HTTP/1.1\r\n";
		req += "Host: hzhwcmhf.duapp.com\r\n";
		req += "Transfer-Encoding: chunked\r\n";
		req += "\r\n";
		send(req);
		
		timeval timeout={90,0};
		setsockopt(client,SOL_SOCKET,SO_RCVTIMEO,&timeout,sizeof(timeout));
		timeout.tv_sec = 30;
		setsockopt(client,SOL_SOCKET,SO_SNDTIMEO,&timeout,sizeof(timeout));
	}
	void send(const string &req)
	{
		int sta = ::send(client, req.c_str(), req.length(), 0);
		if(sta == -1)
		{
			cerr<<"send error/timeout"<<endl;
			close(client);
			throw socket_timeout();
		}
	}
	void sendChunk(const char *req)
	{
		string t = req;
		t += "\n";
		send(t);
	}
	string recvbuf;
	string getChunk()
	{
		while(true){
			int pos = recvbuf.find("\n");
			if(pos!=-1){
				string ans=recvbuf.substr(0,pos);
				recvbuf=recvbuf.substr(pos+1);
				return ans;
			}else{
				recvChunk();
			}
		}
	}
	void recvChunk()
	{
		char buf[1000];
		int sta = recv(client, buf, sizeof(buf), 0);
		if(sta <= 0){
			if(errno == EAGAIN || errno == 0){
				cerr<<"connect lost"<<endl;
				close(client);
				throw socket_timeout();
			}
			cerr<<"recv error"<<endl;
			close(client);
			throw socket_timeout();
			//throw exception();
		}
		recvbuf+=string(buf,buf + sta);
		cerr<<"receiving"<<endl;
	}
	void reconnect()
	{
		while(true){
			try{
				connect();
			}catch(const socket_timeout &e){
				sleep(10);
				cerr<<"reconnecting"<<endl;
				continue;
			}
			break;
		}
		cerr<<"reconnect"<<endl;
	}
};

#ifdef _HZHWCMHF
string judgedir = "/home/judge";
#else
string judgedir = "/home/vfleaking/LiquidWarJudge";
#endif
char bigBuf[10*1024*1024];

void sendResult(mySocket &sc,const string &nowdir,int id,int result,const string &redInfo,const string &blueInfo)
{
	execute_cmd("gzip -c %s/log.bin | base64 >%s/log.base64",nowdir.c_str(),nowdir.c_str());
	FILE *log = fopen((nowdir+"/log.base64").c_str(), "r");
	int size=0;
	sprintf(bigBuf,"{\"id\":%d,\"result\":%d,\"resultInfo\":\"%s\",\"log\":\"\n",
		id,result,
		("<td>" + redInfo +"<td>"+blueInfo).c_str());
	do{
		while(bigBuf[size]) size++;
	}while(fgets(bigBuf+size-1,sizeof(bigBuf)-size,log));
	sprintf(bigBuf+size-1,"\"}");
	fclose(log);
	//cerr<<bigBuf<<endl;
	sc.sendChunk(bigBuf);
}

int main()
{
	//freopen("stderr.out","w",stderr);
	#ifndef DEBUG
	mySocket sc(ip,port);
	#endif
	string rec;
	while(true){
		cerr<<"waiting"<<endl;
		#ifndef DEBUG
		try{
			rec = sc.getChunk();
		}catch(const socket_timeout &e){
			sc.reconnect();
			continue;
		}
		if(rec==""){
			cerr<<"pong"<<endl;
			sc.sendChunk("");
		}else{
			Json::Reader reader;
			Json::Value content;
			if(!reader.parse(rec,content)){
				cerr<<"parse error"<<endl;
				cerr<<rec<<endl;
				throw exception();
			}
			string nowdir=judgedir+"/"+n2s(content["id"].asInt());
			
			execute_cmd("rm -Rf %s/*", nowdir.c_str());
			mkdir(nowdir.c_str(),S_IRWXU|S_IRWXG|S_IRWXO);
			
			cerr<<"judging:" << content["id"].asInt()<<endl;
			AI ai1(1,nowdir+"/1",content["language1"].asInt(),content["source1"].asString());
			AI ai2(2,nowdir+"/2",content["language2"].asInt(),content["source2"].asString());
		#else
			string nowdir=judgedir+"/debug";
			AI ai1(1,nowdir+"/1",1,"");
			AI ai2(2,nowdir+"/2",1,"");
		#endif
			int c1=ai1.compile(),c2=ai2.compile();
			FILE *logFile = fopen((nowdir+"/log.bin").c_str(), "wb");
			if(c1 || c2){
				FILE *compileLog = fopen((nowdir+"/1/ce.txt").c_str(),"r");
				int size = fread(bigBuf,1,65535,compileLog);
				string redCL(bigBuf,bigBuf + size);
				fclose(compileLog);
				compileLog = fopen((nowdir+"/2/ce.txt").c_str(),"r");
				size = fread(bigBuf,1,65535,compileLog);
				string blueCL(bigBuf,bigBuf + size);
				fclose(compileLog);
				//cerr<<redCL<<endl<<blueCL<<endl;
				Judger ju(logFile,redCL,blueCL);
				fclose(logFile);
				int result;
				if(c1 && c2){
					result=0;
				}else if(c1){
					result=2;
				}else if(c2){
					result=1;
				}
				#ifndef DEBUG
				try{
				sendResult(sc,nowdir,content["id"].asInt(),
					result + 3,
					c1?"<font color=blue>Compile Error</font>":"<font color=green>Compiled</font>",
					c2?"<font color=blue>Compile Error</font>":"<font color=green>Compiled</font>");
				}catch(const socket_timeout &e){
					sc.reconnect();
					continue;
				}
				#endif
				cerr<<"Compile Error"<<endl;
				#ifdef DEBUG
				return 0;
				#endif
				continue;
			}
			ai1.make_runtime();
			ai2.make_runtime();
			ai1.run();
			ai2.run();
			
			Judger ju(ai1.in,ai1.out,ai2.in,ai2.out,logFile);
			Runner runner;
			ju.setProgramChecker(&runner);
			
			while (!ju.getIsOver())
			{
				//cerr<<"one turn"<<endl;
				runner.nowAI = &ai1;
				ai1.round++;
				ai1.lasttime=time(0);
				ju.run(O_RED);
				//ai1.usertime = ai1.lasttime;
				//cerr<<"two turn"<<endl;
				runner.nowAI = &ai2;
				ai2.round++;
				ai2.lasttime=time(0);
				ju.run(O_BLUE);
				//ai2.usertime = ai2.lasttime;
				ju.simulate();
			}
			ptrace(PTRACE_KILL, ai1.spid, NULL, NULL);
			ptrace(PTRACE_KILL, ai2.spid, NULL, NULL);
			fclose(logFile);
			
			cerr << ju.msgout.result<<endl;
			cerr << ju.msgout.redInfo.str()<<endl;
			cerr << ju.msgout.blueInfo.str()<<endl;
			
			pid_t   pid;
			int     stat;
			while((pid = waitpid(-1, &stat, WNOHANG)) > 0) {
				printf("child %d terminated\n", pid);
			}
			
			#ifndef DEBUG
			try{
				sendResult(sc,nowdir,content["id"].asInt(),ju.msgout.result,ju.msgout.redInfo.str(),ju.msgout.blueInfo.str());
			}catch(const socket_timeout &e){
				sc.reconnect();
				continue;
			}
			#endif
		#ifndef DEBUG
		}
		#else
		return 0;
		#endif
		
	}
	return 0;
}
