const { BskyAgent } = require('@atproto/api');
const logger = require('../utils/logger');

const handle = process.env.BLUESKY_HANDLE;
const appPassword = process.env.BLUESKY_APP_PASSWORD;

const hasCredentials = handle && appPassword;

let agent = null;
let isMockMode = !hasCredentials;

/**
 * Initialize and login to Bluesky.
 * Must be called once before posting.
 */
async function initialize() {
  if (!hasCredentials) {
    logger.warn('Bluesky credentials missing. Running in Mock Mode.');
    isMockMode = true;
    return;
  }

  try {
    agent = new BskyAgent({ service: 'https://bsky.social' });
    await agent.login({ identifier: handle, password: appPassword });
    logger.info('Successfully logged in to Bluesky as @%s', handle);
    isMockMode = false;
  } catch (error) {
    logger.error('Failed to login to Bluesky: %s', error.message);
    logger.warn('Falling back to Mock Mode due to login failure.');
    isMockMode = true;
    agent = null;
  }
}

/**
 * Post text to Bluesky or mock post if credentials missing.
 * @param {string} text - The text to post
 * @param {Object} [embed] - Optional embed object (e.g. images)
 * @returns {Promise<Object>} - Post response
 */
async function post(text, embed = null) {
  if (isMockMode || !agent) {
    logger.info('[MOCK POST] Posting to Bluesky: "%s" (Embed: %s)', text, embed ? 'Yes' : 'No');
    return {
      uri: `mock_post_${Date.now()}`,
      cid: `mock_cid_${Date.now()}`
    };
  }

  const postData = {
    text: text,
    createdAt: new Date().toISOString()
  };

  if (embed) {
    postData.embed = embed;
  }

  const response = await agent.post(postData);
  return response;
}

/**
 * Upload a binary blob/buffer to Bluesky.
 * @param {Buffer} buffer - The image buffer to upload
 * @param {string} mimeType - The mime type (e.g. 'image/png')
 * @returns {Promise<Object>} - Blob upload response
 */
async function uploadBlob(buffer, mimeType = 'image/png') {
  if (isMockMode || !agent) {
    logger.info('[MOCK BLOB] Uploading blob of type %s (%d bytes)', mimeType, buffer.length);
    return {
      data: {
        blob: {
          $type: 'blob',
          ref: {
            $link: `mock_cid_link_${Date.now()}`
          },
          mimeType: mimeType,
          size: buffer.length
        }
      }
    };
  }

  const response = await agent.uploadBlob(buffer, { encoding: mimeType });
  return response;
}

/**
 * Check if running in mock mode.
 */
function isInMockMode() {
  return isMockMode;
}

module.exports = {
  initialize,
  post,
  uploadBlob,
  isInMockMode
};
