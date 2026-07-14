const jokeService = require('../services/jokeService');
const postingService = require('../services/twitterService');
const logger = require('../utils/logger');

let isJobRunning = false;

/**
 * Executes the joke posting job sequence:
 * 1. Fetch next pending joke.
 * 2. Lock the joke.
 * 3. Post the joke (with retries inside postingService).
 * 4. Mark joke as Posted on success.
 * 5. Unlock joke on failure so it can be retried.
 */
async function runJokePostingJob() {
  if (isJobRunning) {
    logger.warn('Job trigger skipped: Previous posting job is still in progress.');
    return;
  }

  isJobRunning = true;
  logger.info('Joke posting job started.');

  let selectedJoke = null;
  try {
    // 1. Fetch the next joke
    selectedJoke = await jokeService.selectNextJoke();

    if (!selectedJoke) {
      logger.warn('Job finished: No joke available to post (check database seeding or exhaustion strategy).');
      isJobRunning = false;
      return;
    }

    logger.info('Selected joke ID %d for category "%s".', selectedJoke.id, selectedJoke.category);

    // 2. Lock the joke temporarily
    await jokeService.lockJoke(selectedJoke.id);

    // 3. Post to Bluesky
    await postingService.publishPost(selectedJoke);

    // 4. Mark as posted
    await jokeService.markAsPosted(selectedJoke.id);

    logger.info('Joke posting job completed successfully.');
  } catch (error) {
    logger.error('Error occurred in joke posting job: %s', error.message);
    
    // 5. Unlock the joke if we locked it and posting failed
    if (selectedJoke && selectedJoke.id) {
      try {
        await jokeService.unlockJoke(selectedJoke.id);
      } catch (dbError) {
        logger.error('Failed to unlock joke ID %d: %s', selectedJoke.id, dbError.message);
      }
    }
  } finally {
    isJobRunning = false;
  }
}

module.exports = {
  runJokePostingJob,
  getJobStatus: () => ({ isJobRunning })
};
