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
  
  // Engaging, emoji-rich intro lines
  const intros = [
    `${emoji} Daily dose of premium humor:`,
    `🔥😂 Try not to laugh at this one:`,
    `🤣👇 This got me laughing so hard:`,
    `💀💀 I can't even handle this:`,
    `${emoji} Joke of the hour for your feed:`,
    `⚡🤪 Quick laugh to fix your mood:`,
  ];
  
  // Call-to-action prompts with emojis
  const ctas = [
    `\n\n🔁 Repost if you laughed! 😂`,
    `\n\n❤️ Like if this made you smile! 😊`,
    `\n\n🤣 Tag someone who relates to this! 👇`,
    `\n\n🔁 Share the laughs with your friends! 🚀`,
    `\n\n💬 Drop a 😂/💀 in the comments!`,
  ];

  const tag = category.replace(/\s+/g, '');
  
  const formats = [
    // Format 1: Intro + joke + CTA
    () => {
      const intro = intros[Math.floor(Math.random() * intros.length)];
      const cta = ctas[Math.floor(Math.random() * ctas.length)];
      return `${intro}\n\n${jokeObj.joke}${cta}`;
    },
    // Format 2: Emoji frame + joke + hashtags
    () => {
      return `${emoji} ${jokeObj.joke}\n\n#${tag} #jokes😂 #funny🤪 #humor💀`;
    },
    // Format 3: Dramatic pause style
    () => {
      const parts = jokeObj.joke.split('?');
      if (parts.length >= 2) {
        return `🤔 ${parts[0]}?\n\n...\n\n😂 ${parts.slice(1).join('?').trim()} 🤣`;
      }
      const intro = intros[Math.floor(Math.random() * intros.length)];
      return `${intro}\n\n${jokeObj.joke}`;
    },
    // Format 4: Quote style
    () => {
      const cta = ctas[Math.floor(Math.random() * ctas.length)];
      return `"${jokeObj.joke}"\n\n— AutoJokeX ${emoji}${cta}`;
    }
  ];

  // Pick one randomly
  const randomIndex = Math.floor(Math.random() * formats.length);
  let postText = formats[randomIndex]();

  // Bluesky has a 300 character limit (graphemes)
  if (postText.length > 300) {
    logger.warn('Formatted post exceeds 300 chars (%d). Falling back to raw joke.', postText.length);
    postText = `${emoji} ${jokeObj.joke}`;
  }

  if (postText.length > 300) {
    logger.warn('Raw joke still exceeds 300 chars (%d). Truncating.', postText.length);
    postText = postText.substring(0, 297) + '...';
  }

  return postText;
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
