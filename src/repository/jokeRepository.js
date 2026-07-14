const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Fetch the next joke with 'Pending' status.
 * @returns {Promise<Object|null>}
 */
async function getNextPending() {
  const query = `
    SELECT id, category, joke, status, posted_at, created_at
    FROM jokes
    WHERE status = 'Pending'
    ORDER BY id ASC
    LIMIT 1
  `;
  try {
    const joke = await db.get(query);
    return joke || null;
  } catch (error) {
    logger.error('Database error in getNextPending: %s', error.message);
    throw error;
  }
}

/**
 * Update the status and posted timestamp of a joke.
 * @param {number} id 
 * @param {string} status 'Pending', 'Locked', or 'Posted'
 * @param {string|null} postedAt ISO date string or null
 */
async function updateStatus(id, status, postedAt = null) {
  const query = `
    UPDATE jokes
    SET status = ?, posted_at = ?
    WHERE id = ?
  `;
  try {
    await db.run(query, [status, postedAt, id]);
  } catch (error) {
    logger.error(`Database error in updateStatus for ID ${id}: %s`, error.message);
    throw error;
  }
}

/**
 * Reset all jokes back to 'Pending'.
 */
async function resetAllJokes() {
  const query = `
    UPDATE jokes
    SET status = 'Pending', posted_at = NULL
  `;
  try {
    const result = await db.run(query);
    logger.info('All jokes have been reset to Pending status. Count: %d', result.changes);
    return result.changes;
  } catch (error) {
    logger.error('Database error in resetAllJokes: %s', error.message);
    throw error;
  }
}

/**
 * Get joke counts by status.
 * @returns {Promise<{total: number, pending: number, posted: number, locked: number}>}
 */
async function getCounts() {
  const query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'Posted' THEN 1 ELSE 0 END) as posted,
      SUM(CASE WHEN status = 'Locked' THEN 1 ELSE 0 END) as locked
    FROM jokes
  `;
  try {
    const row = await db.get(query);
    return {
      total: row.total || 0,
      pending: row.pending || 0,
      posted: row.posted || 0,
      locked: row.locked || 0
    };
  } catch (error) {
    logger.error('Database error in getCounts: %s', error.message);
    throw error;
  }
}

/**
 * Insert a single joke if it doesn't already exist.
 * @param {string} joke 
 * @param {string} category 
 */
async function insertJoke(joke, category) {
  const query = `
    INSERT INTO jokes (joke, category, status)
    VALUES (?, ?, 'Pending')
    ON CONFLICT(joke) DO UPDATE SET category = excluded.category
  `;
  try {
    const result = await db.run(query, [joke, category]);
    return result.lastID;
  } catch (error) {
    logger.error('Database error in insertJoke: %s', error.message);
    throw error;
  }
}

/**
 * Log details of a tweet attempt.
 * @param {number|null} jokeId 
 * @param {string|null} tweetId 
 * @param {boolean} success 
 * @param {string} response JSON string or error message
 */
async function logTweet(jokeId, tweetId, success, response) {
  const query = `
    INSERT INTO tweet_logs (joke_id, tweet_id, success, response)
    VALUES (?, ?, ?, ?)
  `;
  try {
    await db.run(query, [jokeId, tweetId, success ? 1 : 0, response]);
  } catch (error) {
    logger.error('Database error in logTweet: %s', error.message);
  }
}

/**
 * Fetch all jokes with optional pagination.
 */
async function getJokes(limit = 100, offset = 0) {
  const query = `
    SELECT id, category, joke, status, posted_at, created_at
    FROM jokes
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  try {
    return await db.all(query, [limit, offset]);
  } catch (error) {
    logger.error('Database error in getJokes: %s', error.message);
    throw error;
  }
}

/**
 * Fetch latest tweet logs.
 */
async function getLogs(limit = 50) {
  const query = `
    SELECT tl.id, tl.joke_id, tl.tweet_id, tl.success, tl.response, tl.created_at, j.joke
    FROM tweet_logs tl
    LEFT JOIN jokes j ON tl.joke_id = j.id
    ORDER BY tl.id DESC
    LIMIT ?
  `;
  try {
    return await db.all(query, [limit]);
  } catch (error) {
    logger.error('Database error in getLogs: %s', error.message);
    throw error;
  }
}

module.exports = {
  getNextPending,
  updateStatus,
  resetAllJokes,
  getCounts,
  insertJoke,
  logTweet,
  getJokes,
  getLogs
};
