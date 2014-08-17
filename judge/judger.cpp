#include <iostream>
#include <iomanip>
#include <sstream>
#include <cstdio>
#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <vector>
#include <map>
#include <set>
#include <climits>
using namespace std;
#include "judger.h"

typedef long long s64;

#define for_stl(it, v) for (typeof(v.begin()) it = v.begin(); it != v.end(); it++)

double absfloor(double a)
{
	if (a > 0)
		return floor(a);
	else
		return ceil(a);
}



Owner getEnemy(Owner owner)
{
	if (owner == O_RED)
		return O_BLUE;
	else
		return O_RED;
}

string toStr(Owner owner)
{
	switch (owner)
	{
		case O_RED:
			return "Red";
		case O_BLUE:
			return "Blue";
		default:
			return "None";
	}
}
string getMsgHeader(Owner owner)
{
	switch (owner)
	{
		case O_RED:
			return "Red > ";
		case O_BLUE:
			return "Blue> ";
		default:
			return "None> ";
	}
}

const int TOT_GAME_TIME = 1800;
const int MAX_DROPLET_DISP = 30;
const int MAP_WIDTH = 10000;
const int MAP_HEIGHT = 10000;
const int MAKE_DROPLET_TIME = 5;
const int BRAIN_FULL_BLOOD = 5000;
const int DROPLET_FULL_BLOOD = 20;
const int BRAIN_RADIUS = 500;

inline bool lessPri(const Vector &a, const Vector &b)
{
	if (a.len2() != b.len2())
		return a.len2() < b.len2();
	if (a.x != b.x)
		return a.x < b.x;
	return a.y < b.y;
}




class invalid_movement_error : public myException
{
private:
	string what_arg;
public:
	explicit invalid_movement_error(const string& _what_arg) throw()
		: what_arg(_what_arg){}
	virtual ~invalid_movement_error() throw(){}
	virtual string what() const throw()
	{
		return what_arg;
	}
	virtual string code() const throw()
	{
		return "<font color=red>Invalid Output</font>";
	}
};
class invalid_input_error : public myException
{
public:
	virtual string what() const throw()
	{
		return "invalid output.";
	}
	virtual string code() const throw()
	{
		return "<font color=red>Invalid Output</font>";
	}
};
class failed_to_print_error : public myException
{
public:
	virtual string what() const throw()
	{
		//return "Input Exceeded"
		return "failed to print the situation information.";
	}
	virtual string code() const throw()
	{
		return "<font color=red>Input Exceeded</font>";
	}
};



	Droplet* Judger::getDroplet(Owner owner, int id)
	{
		switch (owner)
		{
			case O_RED:
				if (!(0 <= id && id < (int)redDroplets.size()))
					return NULL;
				return &redDroplets[id];
			case O_BLUE:
				if (!(0 <= id && id < (int)blueDroplets.size()))
					return NULL;
				return &blueDroplets[id];
			default:
				return NULL;
		}
	}
	ExternalPlayer *Judger::getPlayer(Owner owner)
	{
		if (owner == O_RED)
			return &redPlayer;
		else
			return &bluePlayer;
	}

	void Judger::printSitu(Owner owner)
	{
		ExternalPlayer *pl = getPlayer(owner);
		Movement *em = owner == O_RED ? &blueMovement : &redMovement;

		if (fprintf(pl->in, "%d\n", (int)em->shootings.size()) < 0)
			throw failed_to_print_error();
		for_stl(it, em->shootings)
			if (fprintf(pl->in, "%d %d\n", it->first, it->second) < 0)
				throw failed_to_print_error();

		if (fprintf(pl->in, "%d\n", (int)em->poss.size()) < 0)
			throw failed_to_print_error();
		for_stl(it, em->poss)
		{
			int x = it->second.x, y = it->second.y;
			if (owner == O_BLUE)
				x = MAP_WIDTH - x;
			if (fprintf(pl->in, "%d %d %d\n", it->first, x, y) < 0)
				throw failed_to_print_error();
		}

		if (fprintf(pl->in, "%d\n", (int)em->newDropletsPosY.size()) < 0)
			throw failed_to_print_error();
		for_stl(it, em->newDropletsPosY)
			if (fprintf(pl->in, "%d\n", *it) < 0)
				throw failed_to_print_error();

		if (fprintf(pl->in, "0\n") < 0)
			throw failed_to_print_error();
		if (fprintf(pl->in, "-1 -1\n") < 0)
			throw failed_to_print_error();
		if (fprintf(pl->in, "0\n") < 0)
			throw failed_to_print_error();

		if (fflush(pl->in) == EOF)
			throw failed_to_print_error();
	}

	char Judger::readChar(FILE *in)
	{
		char c;
		while ((c = fgetc(in)) == EOF)
		{
			//if (ferror(in))
			//	throw invalid_input_error();
			//cerr<<"read:"<<c<<endl;
			if (programChecker)
				programChecker->check();
		}
		return c;
	}
	int Judger::readInt(FILE *in, char ed)
	{
		char c = readChar(in);
		int res;
		if (c == '0')
		{
			res = 0;
			c = readChar(in);
		}
		else if ('1' <= c && c <= '9')
		{
			res = c - '0';
			while (c = readChar(in), '0' <= c && c <= '9')
			{
				int d = c - '0';
				if (res > (INT_MAX - d) / 10)
					throw invalid_input_error();
				res = res * 10 + d;
			}
		}
		else if (c == '-')
		{
			res = 0;
			c = readChar(in);
			if (!('1' <= c && c <= '9'))
				throw invalid_input_error();
			res = c - '0';
			while (c = readChar(in), '0' <= c && c <= '9')
			{
				int d = c - '0';
				if (-((s64)res * 10 + d) < INT_MIN)
					throw invalid_input_error();
				res = res * 10 + d;
			}
			res = -res;
		}
		else
			throw invalid_input_error();
		if (c != ed)
			throw invalid_input_error();
		return res;
	}

	void Judger::readMovement(Owner owner)
	{
		ExternalPlayer *pl = getPlayer(owner);
		Movement *m = owner == O_RED ? &nextRedMovement : &nextBlueMovement;

		*m = Movement();
		
		int nShootings = readInt(pl->out, '\n');
		if (nShootings < 0)
			throw invalid_movement_error("the number of shootings is negative.");
		for (int i = 0; i < nShootings; i++)
		{
			int shooter = readInt(pl->out, ' '), target = readInt(pl->out, '\n');
			m->shootings.push_back(make_pair(shooter, target));
		}

		int nNewPos = readInt(pl->out, '\n');
		if (nNewPos < 0)
			throw invalid_movement_error("the number of new positions is negative.");
		for (int i = 0; i < nNewPos; i++)
		{
			int id = readInt(pl->out, ' '), x = readInt(pl->out, ' '), y = readInt(pl->out, '\n');
			if (owner == O_BLUE)
				x = MAP_WIDTH - x;
			if (m->poss.count(id))
				throw invalid_movement_error("try moving multiple times.");
			m->poss[id] = Vector(x, y);
		}

		int nNewDropletsPosY = readInt(pl->out, '\n');
		if (nNewDropletsPosY < 0)
			throw invalid_movement_error("the number of new droplets is negative.");
		for (int i = 0; i < nNewDropletsPosY; i++)
		{
			int y = readInt(pl->out, '\n');
			m->newDropletsPosY.push_back(y);
		}
	}

	void Judger::recordChar(const char &a)
	{
		fwrite(&a, 1, sizeof(char), logFile);
	}
	void Judger::recordUChar(const unsigned char &a)
	{
		fwrite(&a, 1, sizeof(unsigned char), logFile);
	}
	void Judger::recordShort(const short &a)
	{
		recordChar(a >> 8 & 255);
		recordChar(a & 255);
	}
	void Judger::recordInt(const int &a)
	{
		recordChar(a >> 24 & 255);
		recordChar(a >> 16 & 255);
		recordChar(a >> 8 & 255);
		recordChar(a & 255);
	}
	void Judger::recordString(const string &s)
	{
		recordInt((int)s.size());
		fwrite(s.c_str(), 1, (int)s.size(), logFile);
	}

	void Judger::recordDisp(Vector d)
	{
		int p = 0;
		while (p < (int)dispList.size() && !(dispList[p].x == d.x && dispList[p].y == d.y))
			p++;
		if (p == (int)dispList.size())
			recordUChar(255);
		else
		{
			if (p < 240)
				recordUChar(15 + p);
			else
				recordUChar((p - 200) >> 8), recordUChar((p - 200) & 255);
			for (int i = p; i > 0; i--)
				dispList[i] = dispList[i - 1];
			dispList[0] = d;
		}
	}

	void Judger::recordMovement(Owner owner)
	{
		Movement *m = owner == O_RED ? &redMovement : &blueMovement;
		recordString(m->errMsg.errMsg);
		if (!m->errMsg.errMsg.empty())
			return;
		recordShort((int)m->shootings.size());
		for_stl(it, m->shootings)
			recordShort(it->first), recordShort(it->second);

		const vector<Droplet> &dr = owner == O_RED ? redDroplets : blueDroplets;
		for_stl(it, dr)
			if (it->blood > 0)
			{
				Vector d;
				if (m->poss.count(it->id))
					d = m->poss[it->id] - it->pos;
				else
					d = Vector(-100, -100);
				recordDisp(d);
			}

		recordShort((int)m->newDropletsPosY.size());
		for_stl(it, m->newDropletsPosY)
			recordShort(*it);
	}

	void Judger::move(Owner owner)
	{
		try
		{
			printSitu(owner);
			readMovement(owner);
		}
		catch (myException &e)
		{
			Movement *m = owner == O_RED ? &nextRedMovement : &nextBlueMovement;
			m->errMsg.errMsg =  getMsgHeader(owner) + e.what();
			m->errMsg.errCode = e.code();
		}
	}

	bool Judger::checkMovementValid(Owner owner)
	{
		Movement *m = owner == O_RED ? &redMovement : &blueMovement;

		if (!m->errMsg.errMsg.empty())
			return false;

		try
		{
			set<int> shooterIdSet;
			for_stl(it, m->shootings)
			{
				Droplet *shooter = getDroplet(owner, it->first);
				Droplet *target = getDroplet(getEnemy(owner), it->second);
				if (shooter == NULL)
					throw invalid_movement_error("invalid shooter.");
				if (target == NULL)
					throw invalid_movement_error("invalid target.");
				if (shooterIdSet.count(it->first))
					throw invalid_movement_error("try shooting multiple targets.");
				if (!shooter->canShoot(*target))
					throw invalid_movement_error("out of firing range.");
				shooterIdSet.insert(it->first);
			}

			for_stl(it, m->poss)
			{
				Droplet *droplet = getDroplet(owner, it->first);
				if (droplet == NULL)
					throw invalid_movement_error("invalid move.");
				if (dist2(droplet->pos, it->second) > sqr(MAX_DROPLET_DISP))
					throw invalid_movement_error("move too fast.");
				if (0 > it->second.x || it->second.x > MAP_WIDTH)
					throw invalid_movement_error("move out of range.");
				if (0 > it->second.y || it->second.y > MAP_HEIGHT)
					throw invalid_movement_error("move out of range.");
			}

			int nWaitingDroplets = owner == O_RED ? nRedWaitingDroplets : nBlueWaitingDroplets;
			if ((int)m->newDropletsPosY.size() > nWaitingDroplets)
				throw invalid_movement_error("too much new droplets.");
			for_stl(it, m->newDropletsPosY)
			{
				if (0 > *it || *it > MAP_HEIGHT)
					throw invalid_movement_error("the new droplet is out of range.");
			}
		}
		catch (myException &e)
		{
			m->errMsg.errMsg = getMsgHeader(owner) + e.what();
			m->errMsg.errCode = e.code();
			return false;
		}

		return true;
	}

	void Judger::calcWinnerAndGameOver(bool isRedLost, bool isBlueLost)
	{
		if(!msgout.redInfo.str().empty() && !msgout.blueInfo.str().empty()){
			winner = O_NONE;
		}
		else if (isRedLost && isBlueLost)
		{
			if (redBrainBlood != blueBrainBlood)
			{
				if (redBrainBlood > blueBrainBlood)
					winner = O_RED;
				else
					winner = O_BLUE;
			}
			else if (redScore != blueScore)
			{
				if (redScore > blueScore)
					winner = O_RED;
				else
					winner = O_BLUE;
			}
			else
				winner = O_NONE;
		}
		else if (isRedLost)
			winner = O_BLUE;
		else if (isBlueLost)
			winner = O_RED;
		gameOver();
	}

	void Judger::gameOver()
	{
		isOver = true;
		if(!msgout.redInfo.str().empty() || !msgout.blueInfo.str().empty()){
			msgout.result=0;
			if(msgout.blueInfo.str().empty()){
				msgout.blueInfo<<"<font color=green>Normal Operation</font>";
				msgout.result=2;
			}else if(msgout.redInfo.str().empty()){
				msgout.redInfo<<"<font color=green>Normal Operation</font>";
				msgout.result=1;
			}
		}else{
			if(winner == O_RED){
				msgout.redInfo<<"<font color=green>";
				msgout.blueInfo<<"<font color=red>";
				msgout.result=1;
			}else if(winner == O_BLUE){
				msgout.blueInfo<<"<font color=green>";
				msgout.redInfo<<"<font color=red>";
				msgout.result=2;
			}else{
				msgout.redInfo<<"<font color=orange>";
				msgout.blueInfo<<"<font color=orange>";
				msgout.result=0;
			}
			msgout.redInfo << "HP:" << redBrainBlood <<" PT:" << redScore << "</font>";
			msgout.blueInfo << "HP:" << blueBrainBlood <<" PT:" << blueScore << "</font>";
		}
	}
	Judger::Judger(FILE *_logFile,const string &redlog,const string &bluelog)
	:logFile(_logFile),redPlayer(NULL, NULL), bluePlayer(NULL,NULL)
	{
		redMovement = Movement();
		redMovement.errMsg.errMsg = getMsgHeader(O_RED) + redlog;
		blueMovement = Movement();
		blueMovement.errMsg.errMsg = getMsgHeader(O_BLUE) + bluelog;
		recordMovement(O_RED);
		recordMovement(O_BLUE);
		fflush(logFile);
	}
	Judger::Judger(FILE *_redIn, FILE *_redOut, FILE *_blueIn, FILE *_blueOut, FILE *_logFile)
		: logFile(_logFile), redPlayer(_redIn, _redOut), bluePlayer(_blueIn, _blueOut),
		programChecker(NULL),
		redBrainPos(1000, 5000), blueBrainPos(9000, 5000),
		redBrainBlood(BRAIN_FULL_BLOOD), blueBrainBlood(BRAIN_FULL_BLOOD),
		nRedWaitingDroplets(0), nBlueWaitingDroplets(0),
		redMakeDropletRestTime(1), blueMakeDropletRestTime(1),
		redScore(0), blueScore(0),
		restTime(TOT_GAME_TIME)
	{
		isOver = false;

		if (_redIn == NULL || _blueIn == NULL)
		{
			calcWinnerAndGameOver(_redIn == NULL, _blueIn == NULL);
			return;
		}

		for (int x = -MAX_DROPLET_DISP; x <= MAX_DROPLET_DISP; x++)
			for (int y = -MAX_DROPLET_DISP; y <= MAX_DROPLET_DISP; y++)
				if (x * x + y * y <= sqr(MAX_DROPLET_DISP))
				dispList.push_back(Vector(x, y));
		sort(dispList.begin(), dispList.end(), lessPri), reverse(dispList.begin(), dispList.end());

		nextRedMovement = Movement();
		nextBlueMovement = Movement();
		simulate();
	}

	void Judger::setProgramChecker(ProgramChecker *_programChecker)
	{
		programChecker = _programChecker;
	}

	bool Judger::getIsOver()
	{
		if(isOver){
			fflush(logFile);
		}
		return isOver;
	}

	void Judger::run(Owner owner)
	{
		move(owner);
	}

	void Judger::simulate()
	{
		cerr << "restTime: " << restTime << endl;

		redMovement = nextRedMovement;
		blueMovement = nextBlueMovement;

		bool isRedLost = !checkMovementValid(O_RED);
		bool isBlueLost = !checkMovementValid(O_BLUE);

		recordMovement(O_RED);
		recordMovement(O_BLUE);

		if (isRedLost || isBlueLost)
		{
			if (isRedLost)
				msgout.redInfo << redMovement.errMsg.errCode;
			if (isBlueLost)
				msgout.blueInfo << blueMovement.errMsg.errCode;
			calcWinnerAndGameOver(isRedLost, isBlueLost);
			return;
		}

		for_stl(it, redDroplets)
			if (it->blood > 0 && dist2(it->pos, blueBrainPos) <= sqr(BRAIN_RADIUS) && blueBrainBlood > 0)
				blueBrainBlood--;
		for_stl(it, blueDroplets)
			if (it->blood > 0 && dist2(it->pos, redBrainPos) <= sqr(BRAIN_RADIUS) && redBrainBlood > 0)
				redBrainBlood--;
		isRedLost = redBrainBlood == 0;
		isBlueLost = blueBrainBlood == 0;
		if (isRedLost || isBlueLost)
		{
			calcWinnerAndGameOver(isRedLost, isBlueLost);
			return;
		}

		for_stl(it, redMovement.shootings)
			if (blueDroplets[it->second].blood > 0)
				blueDroplets[it->second].blood--, redDroplets[it->first].level++;
		for_stl(it, blueMovement.shootings)
			if (redDroplets[it->second].blood > 0)
				redDroplets[it->second].blood--, blueDroplets[it->first].level++;

		for_stl(it, redMovement.poss)
			if (redDroplets[it->first].blood > 0)
				redDroplets[it->first].pos = it->second;
		for_stl(it, blueMovement.poss)
			if (blueDroplets[it->first].blood > 0)
				blueDroplets[it->first].pos = it->second;

		nRedWaitingDroplets -= (int)redMovement.newDropletsPosY.size();
		for_stl(it, redMovement.newDropletsPosY)
		{
			Droplet dr;
			dr.id = (int)redDroplets.size();
			dr.owner = O_RED;
			dr.blood = DROPLET_FULL_BLOOD;
			dr.level = 0;
			dr.pos = Vector(0, *it);
			redDroplets.push_back(dr);
		}
		nBlueWaitingDroplets -= (int)blueMovement.newDropletsPosY.size();
		for_stl(it, blueMovement.newDropletsPosY)
		{
			Droplet dr;
			dr.id = (int)blueDroplets.size();
			dr.owner = O_BLUE;
			dr.blood = DROPLET_FULL_BLOOD;
			dr.level = 0;
			dr.pos = Vector(MAP_WIDTH, *it);
			blueDroplets.push_back(dr);
		}

		for_stl(it, blueDroplets)
			if (it->blood > 0)
			{
				int d = (int)floor(sqrt(dist2(it->pos, redBrainPos)) / 500);
				blueScore += max(8 - d, 0);
			}
		for_stl(it, redDroplets)
			if (it->blood > 0)
			{
				int d = (int)floor(sqrt(dist2(it->pos, blueBrainPos)) / 500);
				redScore += max(8 - d, 0);
			}

		redMakeDropletRestTime--;
		if (redMakeDropletRestTime == 0) {
			nRedWaitingDroplets++;
			redMakeDropletRestTime += MAKE_DROPLET_TIME;
		}
		blueMakeDropletRestTime--;
		if (blueMakeDropletRestTime == 0) {
			nBlueWaitingDroplets++;
			blueMakeDropletRestTime += MAKE_DROPLET_TIME;
		}

		restTime--;
		if (restTime == 0)
		{
			calcWinnerAndGameOver(true, true);
			return;
		}
	}

/*int main()
{
	FILE *redIn = fopen("RED.in", "w");
	FILE *redOut = fopen("RED.out", "r");
	FILE *blueIn = fopen("BLUE.in", "w");
	FILE *blueOut = fopen("BLUE.out", "r");
	FILE *logFile = fopen("log.bin", "wb");

	// Oops, open red program failed!
	// no problem!
	// Judger ju(NULL, NULL, blueIn, blueOut, logFile);
	// 

	Judger ju(redIn, redOut, blueIn, blueOut, logFile);

	SampleProgramChecker checker;
	// you can set program checker at any time.
	ju.setProgramChecker(&checker);

	while (!ju.getIsOver())
	{
		ju.run(O_RED);
		ju.run(O_BLUE);
		ju.simulate();
	}
	cerr << ju.getMsg();

    return 0;
}
*/