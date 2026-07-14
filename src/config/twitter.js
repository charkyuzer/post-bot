const { TwitterApi } = require('twitter-api-v2');
const logger = require('../utils/logger');

const apiKey = process.env.TWITTER_API_KEY;
const apiSecret = process.env.TWITTER_API_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessSecret = process.env.TWITTER_ACCESS_SECRET;

let twitterClient;

// Check if credentials are set
const hasCredentials = apiKey && apiSecret && accessToken && accessSecret;

if (hasCredentials) {
  logger.info('Initializing live Twitter API v2 Client.');
  twitterClient = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });
} else {
  logger.warn('Twitter API Credentials missing. Running in Mock Twitter Mode.');
  // Create a mock client that mirrors the structure we use from twitter-api-v2
  twitterClient = {
    v2: {
      tweet: async (text) => {
        logger.info('[MOCK TWEET] Tweeting: "%s"', text);
        return {
          data: {
            id: `mock_tweet_${Date.now()}`,
            text: text
          }
        };
      }
    }
  };
}

module.exports = twitterClient;
