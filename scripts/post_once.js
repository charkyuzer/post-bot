require('dotenv').config();
const db = require('../src/config/db');
const bluesky = require('../src/config/bluesky');
const jokeService = require('../src/services/jokeService');
const twitterService = require('../src/services/twitterService');
const logger = require('../src/utils/logger');

async function runOnce() {
  try {
    logger.info('Connecting to database...');
    await db.connect();

    logger.info('Initializing Bluesky connection...');
    await bluesky.initialize();

    if (bluesky.isInMockMode()) {
      logger.error('ERROR: Bluesky is in MOCK MODE. Please check your credentials in the .env file.');
      process.exit(1);
    }

    logger.info('Selecting next pending joke...');
    const joke = await jokeService.selectNextJoke();
    if (!joke) {
      logger.error('No pending jokes found.');
      process.exit(1);
    }

    logger.info('Selected joke ID: %d, Category: %s', joke.id, joke.category);
    logger.info('Joke Text: "%s"', joke.joke);

    // Lock the joke in db
    await jokeService.lockJoke(joke.id);

    // Publish the post (this will generate the card image and upload/embed it)
    logger.info('Publishing to Bluesky (this will generate the card image)...');
    const response = await twitterService.publishPost(joke);
    logger.info('Post Successful! URI: %s', response.uri);

    // Mark as posted in db
    await jokeService.markAsPosted(joke.id);

    logger.info('All done successfully!');
  } catch (error) {
    logger.error('Post failed: %s', error.stack);
  } finally {
    await db.close();
    logger.info('Database connection closed.');
  }
}

runOnce();
