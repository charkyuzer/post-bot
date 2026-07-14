# AutoJokeX Bot

Autonomous Twitter (X) Joke Posting Bot built with Node.js, Express, SQLite, and Winston.

---

## 🚀 Key Features

* **24/7 Autopilot:** Posts a joke every hour automatically.
* **Smart Joke Selection:** Selects jokes sequentially without repeating.
* **Exhaustion Strategy:** Choose to reset and start over (`ON_EXHAUSTION=reset`) or stop posting and log a message (`ON_EXHAUSTION=stop`).
* **Mock API Mode:** If Twitter developer credentials are not supplied, the bot operates in mock mode (logging mock tweets to logs/console), allowing easy testing and previewing.
* **Premium Dashboard:** Serves a beautifully styled Control Center at `http://localhost:3000/` featuring database statistics, recent post logs, upcoming jokes, and a button to manually trigger a post immediately.
* **Fault-Tolerant:** Automatic retries with exponential backoff on Twitter network errors.
* **Docker Ready:** Built-in multi-platform Docker configuration.

---

## 🛠️ Folder Structure

```
twitter-bot/
├── scripts/
│   └── importJokes.js      # Seeding script with 50+ preloaded jokes
├── src/
│   ├── app.js              # Application entrypoint & Express server
│   ├── config/
│   │   ├── db.js           # Promisified SQLite client & migration script
│   │   └── twitter.js      # Twitter API v2 Client (with mock fallback)
│   ├── jobs/
│   │   └── hourlyJob.js    # Joke posting job sequence logic
│   ├── repository/
│   │   └── jokeRepository.js # Data access object for database
│   ├── services/
│   │   ├── jokeService.js  # Business rules & exhaustion strategy
│   │   ├── schedulerService.js # node-cron scheduler wrapper
│   │   └── twitterService.js # Posting service with exponential backoff
│   └── utils/
│       └── logger.js       # Winston logger setup (console + file streams)
├── tests/
│   └── bot.test.js         # Integration and unit tests (Jest)
├── .env                    # System environment configuration
├── Dockerfile              # Container configuration
└── package.json            # Dependencies & start scripts
```

---

## ⚙️ Configuration (.env)

Duplicate `.env` and fill out your configuration parameters:

```ini
PORT=3000
NODE_ENV=development
DATABASE_PATH=src/database/jokes.db

# Twitter API Credentials (Leave empty to enable Mock Posting Mode)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
BEARER_TOKEN=

# Job Settings
POST_INTERVAL="0 * * * *"   # Cron pattern (default: hourly)
MAX_RETRY=3                 # Retry attempts on API error
LOG_LEVEL=info

# Exhaustion Strategy: "reset" (start over) or "stop" (halt scheduler)
ON_EXHAUSTION=reset
```

---

## 🏗️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the Database
Populates the SQLite database with 50 high-quality jokes across 10 categories (Programming, Dad Jokes, Office, etc.):
```bash
npm run seed
```

### 3. Run Locally (Development)
```bash
npm start
```
Visit `http://localhost:3000/` in your browser to view the Control Center dashboard.

### 4. Run Tests
Runs unit and integration tests using Jest:
```bash
npm test
```

---

## 🐳 Docker Deployment

### 1. Build Image
```bash
docker build -t autojokex-bot .
```

### 2. Run Container
```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/src/database:/usr/src/app/src/database \
  -v $(pwd)/logs:/usr/src/app/logs \
  --env-file .env \
  --name autojokex-bot-container \
  autojokex-bot
```
*(Using volumes ensures SQLite database file `jokes.db` and logger output files persist across container restarts)*
