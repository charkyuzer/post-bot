const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const dbPath = path.resolve(
  process.env.DATABASE_PATH || path.join(__dirname, '../database/jokes.db')
);

// Ensure the directory for the database exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

function connect() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Failed to connect to SQLite database: %s', err.message);
        return reject(err);
      }
      logger.info('Connected to SQLite database at %s', dbPath);
      
      // Run migrations
      migrate()
        .then(resolve)
        .catch(reject);
    });
  });
}

function migrate() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create jokes table
      db.run(`
        CREATE TABLE IF NOT EXISTS jokes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          joke TEXT NOT NULL UNIQUE,
          status TEXT DEFAULT 'Pending',
          posted_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          logger.error('Failed to create jokes table: %s', err.message);
          return reject(err);
        }
      });

      // Create tweet_logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS tweet_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          joke_id INTEGER,
          tweet_id TEXT,
          success INTEGER, -- 1 for true, 0 for false
          response TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(joke_id) REFERENCES jokes(id)
        )
      `, (err) => {
        if (err) {
          logger.error('Failed to create tweet_logs table: %s', err.message);
          return reject(err);
        }
        logger.info('Database migrations applied successfully.');
        resolve();
      });
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function close() {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();
    db.close((err) => {
      if (err) return reject(err);
      logger.info('Database connection closed.');
      resolve();
    });
  });
}

module.exports = {
  connect,
  run,
  get,
  all,
  close,
  getRawDb: () => db
};
