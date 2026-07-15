require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bluesky = require('../src/config/bluesky');
const twitterService = require('../src/services/twitterService');
const logger = require('../src/utils/logger');

const JOKES_FILE_PATH = path.join(__dirname, '../src/data/jokes.json');

async function runGitHubAction() {
  try {
    logger.info('Starting GitHub Actions Bluesky Job...');

    // Load jokes
    if (!fs.existsSync(JOKES_FILE_PATH)) {
      logger.error('Jokes file not found at %s', JOKES_FILE_PATH);
      process.exit(1);
    }

    const jokes = JSON.parse(fs.readFileSync(JOKES_FILE_PATH, 'utf8'));

    // Prevent double-posting: skip if last post was less than 45 minutes ago
    const lastPosted = jokes.filter(j => j.posted_at).sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at))[0];
    if (lastPosted) {
      const minutesSinceLastPost = (Date.now() - new Date(lastPosted.posted_at)) / 60000;
      if (minutesSinceLastPost < 45) {
        logger.info('Last post was %.1f minutes ago. Skipping to prevent double-post.', minutesSinceLastPost);
        process.exit(0);
      }
    }

    // Find first unposted joke
    const nextJokeIndex = jokes.findIndex(j => !j.posted);

    if (nextJokeIndex === -1) {
      logger.warn('All 200 jokes have been posted! No new joke to post.');
      process.exit(0);
    }

    const jokeToPost = jokes[nextJokeIndex];
    logger.info('Selected Joke ID %d: "%s"', jokeToPost.id, jokeToPost.joke);

    // Initialize Bluesky
    await bluesky.initialize();

    if (bluesky.isInMockMode()) {
      logger.error('Bluesky is running in Mock Mode! Please check BLUESKY_HANDLE and BLUESKY_APP_PASSWORD secrets/variables.');
      process.exit(1);
    }

    // Publish the post (this will format it and generate + upload the image)
    logger.info('Publishing to Bluesky...');
    const postResponse = await twitterService.publishPost(jokeToPost);
    logger.info('Post successful! URI: %s', postResponse.uri);

    // Update joke status
    jokes[nextJokeIndex].posted = true;
    jokes[nextJokeIndex].posted_at = new Date().toISOString();

    // Write back to jokes.json
    fs.writeFileSync(JOKES_FILE_PATH, JSON.stringify(jokes, null, 2), 'utf8');
    logger.info('Successfully updated jokes.json with posted status for joke ID %d.', jokeToPost.id);

  } catch (error) {
    logger.error('Error during GitHub Action execution: %s', error.stack);
    process.exit(1);
  }
}

runGitHubAction();
