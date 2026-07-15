const bluesky = require('../config/bluesky');
const jokeRepository = require('../repository/jokeRepository');
const logger = require('../utils/logger');
const imageGenerator = require('../utils/imageGenerator');

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

  // 1. Build the parts
  const intro = `${emoji} Daily dose of humor:`;
  const cta = `\n\nLike ❤️ | Repost 🔁 | Follow for daily laughs! ✨`;
  const hashtags = `\n#${tag} #jokes #funny #humor`;

  // 2. Try to combine all parts
  let fullPost = `${intro}\n\n${jokeObj.joke}${cta}${hashtags}`;

  // 3. Fallback strategies if the full post exceeds 300 characters
  if (fullPost.length > 300) {
    // Strategy A: Remove hashtags first
    fullPost = `${intro}\n\n${jokeObj.joke}${cta}`;
  }

  if (fullPost.length > 300) {
    // Strategy B: Remove CTA, keep hashtags
    fullPost = `${emoji} ${jokeObj.joke}\n\n#${tag} #jokes #funny`;
  }

  if (fullPost.length > 300) {
    // Strategy C: Just emoji + raw joke
    fullPost = `${emoji} ${jokeObj.joke}`;
  }

  if (fullPost.length > 300) {
    // Ultimate fallback: truncate joke text
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
      
      // Log success to DB
      await jokeRepository.logTweet(jokeObj.id, postId, true, JSON.stringify(response));
      
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
        
        // Log failure to DB
        await jokeRepository.logTweet(
          jokeObj.id, 
          null, 
          false, 
          JSON.stringify({ error: error.message, stack: error.stack })
        );
        
        throw error;
      }
    }
  }
}

module.exports = {
  publishPost,
  formatPost
};
