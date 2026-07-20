const bluesky = require('../config/bluesky');
const logger = require('../utils/logger');
const imageGenerator = require('../utils/imageGenerator');

// jokeRepository uses sqlite3 (native module). In GitHub Actions, it may not
// be available, so we load it lazily and fail gracefully.
let jokeRepository = null;
try {
  jokeRepository = require('../repository/jokeRepository');
} catch (e) {
  logger.warn('jokeRepository could not be loaded (sqlite3 unavailable?): %s', e.message);
}

// Helper sleep function for backoff
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Format a joke based on category, adding engaging intros, CTAs and emojis
 * while respecting Bluesky's 300 char limit.
 * @param {Object} jokeObj 
 * @returns {string}
 */
function formatPost(jokeObj) {
  const emojiMap = {
    programming: '💻🤓',
    'dad jokes': '👴🤪',
    office: '👔💼',
    college: '🎓📚',
    engineering: '⚙️🛠️',
    technology: '🔌📡',
    relationship: '❤️👩‍❤️‍👨',
    animals: '🐱🦁',
    puns: '💡🧠',
    random: '🤪🤪',
    'daily life': '🏡🚶‍♂️'
  };

  const category = (jokeObj.category || 'random').toLowerCase();
  const emoji = emojiMap[category] || '😄✨';
  
  // Clean tag name
  const tag = category.replace(/\s+/g, '');

  // Unique intros rotating by joke ID
  const intros = [
    `${emoji} Aaj ka joke:`,
    `${emoji} Haste raho!`,
    `${emoji} Ye suno zara...`,
    `${emoji} Mood fresh karo:`,
    `${emoji} Ek dum mast joke:`,
    `${emoji} Padhke hasna mat bhoolna:`,
    `${emoji} Break time joke:`,
    `${emoji} Aaj bhi ek joke:`,
    `${emoji} Chhota sa joke:`,
    `${emoji} Ye wala sunna chahiye:`,
    `${emoji} Hasne ki dose:`,
    `${emoji} Seedha dil pe:`,
  ];
  const intro = intros[(jokeObj.id || 0) % intros.length];
  const cta = `\n\n❤️ Like  🔁 Share  👤 Follow @jokerryan.bsky.social`;
  const hashtags = `\n#${tag} #jokes #funny #humor`;

  // 2. Try the full version first: intro + joke + cta + hashtags
  let fullPost = `${intro}\n\n${jokeObj.joke}${cta}${hashtags}`;

  // 3. Fallback chain if post exceeds Bluesky's 300 char limit
  if (fullPost.length > 300) {
    // Drop hashtags
    fullPost = `${intro}\n\n${jokeObj.joke}${cta}`;
  }

  if (fullPost.length > 300) {
    // Drop intro, keep cta + hashtags
    fullPost = `${emoji} ${jokeObj.joke}${cta}`;
  }

  if (fullPost.length > 300) {
    // Keep only emoji + joke
    fullPost = `${emoji} ${jokeObj.joke}`;
  }

  if (fullPost.length > 300) {
    // Last resort: truncate
    fullPost = jokeObj.joke.substring(0, 297) + '...';
  }

  return fullPost;
}


/**
 * Post a joke to Bluesky with retry logic and database logging.
 * @param {Object} jokeObj 
 * @returns {Promise<Object>} The API response or mock response
 */
async function publishPost(jokeObj) {
  const maxRetries = parseInt(process.env.MAX_RETRY || '3', 10);
  const postText = formatPost(jokeObj);
  
  let attempt = 0;
  let delay = 1000; // start with 1 second delay

  while (attempt < maxRetries) {
    attempt++;
    try {
      logger.info('Attempt %d of %d to post for joke ID %d.', attempt, maxRetries, jokeObj.id);
      
      let embed = null;
      if (process.env.POST_IMAGE !== 'false') {
        try {
          logger.info('Generating dynamic image card for joke ID %d...', jokeObj.id);
          const imageBuffer = await imageGenerator.generateJokeCard(jokeObj);
          
          logger.info('Uploading image card blob...');
          const uploadRes = await bluesky.uploadBlob(imageBuffer, 'image/png');
          
          embed = {
            $type: 'app.bsky.embed.images',
            images: [
              {
                alt: `Joke card for category: ${jokeObj.category}`,
                image: uploadRes.data.blob
              }
            ]
          };
          logger.info('Successfully generated and uploaded image card embed.');
        } catch (imgError) {
          logger.error('Failed to generate/upload image card: %s. Falling back to text-only post.', imgError.message);
        }
      }
      
      const response = await bluesky.post(postText, embed);
      const postId = response.uri || response.cid || `post_${Date.now()}`;
      
      logger.info('Successfully posted with ID %s.', postId);
      
      // Log success to DB (optional — skipped if sqlite3 unavailable)
      if (jokeRepository) {
        try {
          await jokeRepository.logTweet(jokeObj.id, postId, true, JSON.stringify(response));
        } catch (dbErr) {
          logger.warn('DB log failed (non-fatal): %s', dbErr.message);
        }
      }
      
      return response;
    } catch (error) {
      logger.error('Error posting on attempt %d: %s', attempt, error.message);
      
      if (attempt < maxRetries) {
        logger.info('Waiting %dms before retry...', delay);
        await sleep(delay);
        delay *= 2; // exponential backoff
      } else {
        // Last attempt failed
        logger.error('All posting retries failed for joke ID %d.', jokeObj.id);
        
        // Log failure to DB (optional — skipped if sqlite3 unavailable)
        if (jokeRepository) {
          try {
            await jokeRepository.logTweet(
              jokeObj.id,
              null,
              false,
              JSON.stringify({ error: error.message, stack: error.stack })
            );
          } catch (dbErr) {
            logger.warn('DB log failed (non-fatal): %s', dbErr.message);
          }
        }

        throw error;
      }
    }
  }
}

module.exports = {
  publishPost,
  formatPost
};
