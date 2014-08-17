enum Owner
{
	O_NONE = 0, O_RED = 1, O_BLUE = 2
};
inline int sqr(const int &a)
{
	return a * a;
}

struct Vector
{
	int x, y;

	Vector(){}
	Vector(const int &_x, const int &_y)
		: x(_x), y(_y){}

	friend inline Vector operator+(const Vector &a, const Vector &b)
	{
		return Vector(a.x + b.x, a.y + b.y);
	}
	friend inline Vector operator-(const Vector &a, const Vector &b)
	{
		return Vector(a.x - b.x, a.y - b.y);
	}

	inline Vector &operator+=(const Vector &b)
	{
		x += b.x, y += b.y;
		return *this;
	}
	inline Vector &operator-=(const Vector &b)
	{
		x -= b.x, y -= b.y;
		return *this;
	}

	inline int len2() const
	{
		return sqr(x) + sqr(y);
	}

	friend inline istream& operator>>(istream& in, Vector &v)
	{
		return in >> v.x >> v.y;
	}
	friend inline ostream& operator<<(ostream &out, const Vector &v)
	{
		return out << v.x << " " << v.y;
	}
};

inline int dist2(const Vector &a, const Vector &b)
{
	return sqr(a.x - b.x) + sqr(a.y - b.y);
}

class ProgramChecker
{
public:
	virtual void check() = 0;
};

struct Droplet
{
	int id;
	Owner owner;
	int blood;
	int level;
	Vector pos;

	Vector targetPos;
	bool shouldSpread;
	bool isChoosen;

	inline int getShootingDist() const
	{
		return 300 + level * 3;
	}

	inline bool canShoot(const Droplet target) const
	{
		return dist2(pos, target.pos) <= sqr(getShootingDist());
	}
};
struct ErrorMessage
{
	string errMsg,errCode;
};
struct Movement
{
	ErrorMessage errMsg;
	vector< pair<int, int> > shootings;
	map<int, Vector> poss;
	vector<int> newDropletsPosY;
};

struct ExternalPlayer
{
	FILE *in, *out;
	ExternalPlayer(FILE *_in, FILE *_out)
		: in(_in), out(_out){}
};
struct GameMessage
{
	int result;
	ostringstream redInfo,blueInfo;
};
class Judger
{
private:

	FILE *logFile;

	ExternalPlayer redPlayer, bluePlayer;

	ProgramChecker *programChecker;

	Vector redBrainPos, blueBrainPos;
	int redBrainBlood, blueBrainBlood;
	vector<Droplet> redDroplets, blueDroplets;
	int nRedWaitingDroplets, nBlueWaitingDroplets;
	int redMakeDropletRestTime, blueMakeDropletRestTime;
	int redScore, blueScore;
	int restTime;

	bool isOver;
	Owner winner;

	Movement redMovement;
	Movement blueMovement;

	Movement nextRedMovement;
	Movement nextBlueMovement;

	Droplet *getDroplet(Owner owner, int id);
	ExternalPlayer *getPlayer(Owner owner);
	void printSitu(Owner owner);
	char readChar(FILE *in);
	int readInt(FILE *in, char ed);
	void readMovement(Owner owner);
	void recordChar(const char &a);
	void recordUChar(const unsigned char &a);
	void recordShort(const short &a);
	void recordInt(const int &a);
	void recordString(const string &s);
	vector<Vector> dispList;
	void recordDisp(Vector d);
	void recordMovement(Owner owner);
	void move(Owner owner);
	bool checkMovementValid(Owner owner);
	void calcWinnerAndGameOver(bool isRedLost, bool isBlueLost);
	void gameOver();
public:
	GameMessage msgout;
	Judger(FILE *_logFile,const string &redlog,const string &bluelog);
	Judger(FILE *_redIn, FILE *_redOut, FILE *_blueIn, FILE *_blueOut, FILE *_logFile);
	void setProgramChecker(ProgramChecker *_programChecker);
	bool getIsOver();
	void run(Owner owner);
	void simulate();
};

class myException
{
public:
	explicit myException() throw(){}
	virtual ~myException() throw(){}
	virtual string code() const throw() = 0;
	virtual string what() const throw() = 0;
};