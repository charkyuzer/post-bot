const jokeRepository = require('../repository/jokeRepository');
const logger = require('../utils/logger');

/**
 * Service to select the next joke to post, handling exhaustion strategy if no pending joke is found.
 * @returns {Promise<Object|null>}
 */
async function selectNextJoke() {
  let joke = await jokeRepository.getNextPending();
  
  if (!joke) {
    logger.info('No pending jokes found in the database. Checking exhaustion strategy...');
    const strategy = (process.env.ON_EXHAUSTION || 'reset').toLowerCase();
    
    if (strategy === 'reset') {
      logger.info('Exhaustion strategy is "reset". Resetting all jokes to "Pending"...');
      const resetCount = await jokeRepository.resetAllJokes();
      if (resetCount > 0) {
        joke = await jokeRepository.getNextPending();
      }
    } else {
      logger.warn('Exhaustion strategy is "stop" or unrecognized ("%s"). Halting joke selection.', strategy);
      return null;
    }
  }
  
  return joke;
}

/**
 * Lock a joke by setting its status to 'Locked'.
 * @param {number} id 
 */
async function lockJoke(id) {
  logger.info('Locking joke ID %d before posting.', id);
  await jokeRepository.updateStatus(id, 'Locked');
}

/**
 * Mark a joke as successfully posted.
 * @param {number} id 
 */
async function markAsPosted(id) {
  const postedAt = new Date().toISOString();
  logger.info('Marking joke ID %d as posted at %s.', id, postedAt);
  await jokeRepository.updateStatus(id, 'Posted', postedAt);
}

/**
 * Unlock a joke (revert its status to 'Pending') on failure.
 * @param {number} id 
 */
async function unlockJoke(id) {
  logger.info('Unlocking joke ID %d (reverting status to Pending).', id);
  await jokeRepository.updateStatus(id, 'Pending');
}

/**
 * Get statistical metrics on joke statuses.
 */
async function getStats() {
  return await jokeRepository.getCounts();
}

/**
 * Get all jokes paginated.
 */
async function getJokes(limit, offset) {
  return await jokeRepository.getJokes(limit, offset);
}

/**
 * Get recent tweet log history.
 */
async function getLogs(limit) {
  return await jokeRepository.getLogs(limit);
}

/**
 * Add a new joke manually.
 */
async function addJoke(joke, category) {
  if (!joke || !category) {
    throw new Error('Joke and Category are required.');
  }
  return await jokeRepository.insertJoke(joke, category);
}

module.exports = {
  selectNextJoke,
  lockJoke,
  markAsPosted,
  unlockJoke,
  getStats,
  getJokes,
  getLogs,
  addJoke
};
