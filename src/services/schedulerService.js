const cron = require('node-cron');
const { runJokePostingJob } = require('../jobs/hourlyJob');
const logger = require('../utils/logger');

let cronTask = null;
const postInterval = process.env.POST_INTERVAL || '0 * * * *';

function start() {
  if (cronTask) {
    logger.warn('Scheduler is already running.');
    return;
  }

  // Validate cron syntax
  if (!cron.validate(postInterval)) {
    logger.error('Invalid cron expression for POST_INTERVAL: "%s". Scheduler not started.', postInterval);
    throw new Error(`Invalid cron expression: ${postInterval}`);
  }

  logger.info('Starting cron scheduler with interval: "%s"', postInterval);

  cronTask = cron.schedule(postInterval, async () => {
    logger.info('Cron trigger fired.');
    try {
      await runJokePostingJob();
    } catch (err) {
      logger.error('Error executing scheduled job: %s', err.message);
    }
  });
}

function stop() {
  if (cronTask) {
    logger.info('Stopping cron scheduler.');
    cronTask.stop();
    cronTask = null;
  } else {
    logger.warn('Scheduler is not running.');
  }
}

function getStatus() {
  return {
    isRunning: cronTask !== null,
    interval: postInterval
  };
}

module.exports = {
  start,
  stop,
  getStatus
};
