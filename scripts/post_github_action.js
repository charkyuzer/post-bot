require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bluesky = require('../src/config/bluesky');
const twitterService = require('../src/services/twitterService');
const logger = require('../src/utils/logger');
const db = require('../src/config/db');

const JOKES_FILE_PATH = path.join(__dirname, '../src/data/jokes.json');

async function runGitHubAction() {
  try {
    logger.info('🚀 Starting GitHub Actions Bluesky Job...');

    // Initialize database connection
    logger.info('📊 Initializing database connection...');
    await db.connect();
    logger.info('✅ Database connected.');

    // Load jokes
    logger.info('📖 Loading jokes from %s', JOKES_FILE_PATH);
    if (!fs.existsSync(JOKES_FILE_PATH)) {
      logger.error('❌ Jokes file not found at %s', JOKES_FILE_PATH);
      await db.close();
      process.exit(1);
    }

    const jokes = JSON.parse(fs.readFileSync(JOKES_FILE_PATH, 'utf8'));
    logger.info('✅ Loaded %d jokes', jokes.length);

    // Prevent double-posting: skip if last post was less than 45 minutes ago
    logger.info('⏱️  Checking last post time...');
    const lastPosted = jokes.filter(j => j.posted_at).sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at))[0];
    if (lastPosted) {
      const minutesSinceLastPost = (Date.now() - new Date(lastPosted.posted_at)) / 60000;
      if (minutesSinceLastPost < 45) {
        logger.info('⏭️  Last post was %.1f minutes ago. Skipping to prevent double-post.', minutesSinceLastPost);
        await db.close();
        process.exit(0);
      }
    }

    // Find first unposted joke
    logger.info('🔍 Finding next unposted joke...');
    let nextJokeIndex = jokes.findIndex(j => !j.posted);

    // If all jokes are posted, reset them for a new cycle
    if (nextJokeIndex === -1) {
      logger.info('🔄 All jokes have been posted! Resetting cycle...');
      jokes.forEach(j => {
        j.posted = false;
        j.posted_at = null;
      });
      nextJokeIndex = 0;
      logger.info('✅ Reset complete! Starting fresh cycle with joke ID 1.');
    }

    const jokeToPost = jokes[nextJokeIndex];
    logger.info('😂 Selected Joke ID %d: "%s"', jokeToPost.id, jokeToPost.joke);

    // Initialize Bluesky
    logger.info('🌐 Initializing Bluesky connection...');
    await bluesky.initialize();

    if (bluesky.isInMockMode()) {
      logger.warn('⚠️  Bluesky is running in Mock Mode! Credentials not properly configured.');
      logger.warn('   BLUESKY_HANDLE: %s', process.env.BLUESKY_HANDLE || 'NOT SET');
      logger.warn('   BLUESKY_APP_PASSWORD: %s', process.env.BLUESKY_APP_PASSWORD ? '***' : 'NOT SET');
      logger.info('   Continuing in mock mode for testing purposes...');
    }

    // Publish the post (this will format it and generate + upload the image)
    logger.info('📤 Publishing to Bluesky...');
    const postResponse = await twitterService.publishPost(jokeToPost);
    logger.info('✅ Post successful! URI: %s', postResponse.uri);

    // Update joke status
    logger.info('💾 Updating jokes.json with posted status...');
    jokes[nextJokeIndex].posted = true;
    jokes[nextJokeIndex].posted_at = new Date().toISOString();

    // Write back to jokes.json
    fs.writeFileSync(JOKES_FILE_PATH, JSON.stringify(jokes, null, 2), 'utf8');
    logger.info('✅ Successfully updated jokes.json with posted status for joke ID %d.', jokeToPost.id);

  } catch (error) {
    logger.error('❌ Error during GitHub Action execution!');
    logger.error('Error message: %s', error.message);
    logger.error('Error stack: %s', error.stack);
    logger.error('Error name: %s', error.name);
    if (error.response) {
      logger.error('Error response: %s', JSON.stringify(error.response, null, 2));
    }
    try {
      await db.close();
    } catch (dbError) {
      logger.error('Error closing database: %s', dbError.message);
    }
    process.exit(1);
  }
  
  // Successful completion - close database and exit
  await db.close();
}

runGitHubAction();
