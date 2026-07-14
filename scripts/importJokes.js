const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before importing db/logger
dotenv.config({ path: path.join(__dirname, '../.env') });

const db = require('../src/config/db');
const jokeRepository = require('../src/repository/jokeRepository');
const logger = require('../src/utils/logger');

const jokesList = [
  // Programming
  { category: 'Programming', joke: "Why do Java developers wear glasses? Because they don't C#." },
  { category: 'Programming', joke: "How many programmers does it take to change a light bulb? None, that's a hardware problem." },
  { category: 'Programming', joke: "There are 10 types of people in this world: Those who understand binary, and those who don't." },
  { category: 'Programming', joke: "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'" },
  { category: 'Programming', joke: "What is a programmer's favorite hangout place? Foo Bar." },

  // Dad Jokes
  { category: 'Dad Jokes', joke: "I'm reading a book on anti-gravity. I just can't put it down!" },
  { category: 'Dad Jokes', joke: "Why don't scientists trust atoms? Because they make up everything!" },
  { category: 'Dad Jokes', joke: "What do you call a factory that makes okay products? A satisfactory." },
  { category: 'Dad Jokes', joke: "How does a penguin build its house? Igloos it together." },
  { category: 'Dad Jokes', joke: "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them." },

  // Office
  { category: 'Office', joke: "Why did the scarecrow get promoted? Because he was outstanding in his field!" },
  { category: 'Office', joke: "Nothing ruins a Friday more than realizing it's only Tuesday." },
  { category: 'Office', joke: "My email password has been hacked. That's the third time I've had to rename my cat." },
  { category: 'Office', joke: "An office is where you can do absolutely nothing for 8 hours and feel completely exhausted afterward." },
  { category: 'Office', joke: "Tell your boss what you really think of him, and the truth shall set you free. From your job." },

  // College
  { category: 'College', joke: "College: Where you sleep less, study more, and somehow remember absolutely nothing during the exam." },
  { category: 'College', joke: "Why did the student eat their homework? Because the teacher said it was a piece of cake!" },
  { category: 'College', joke: "My college degree is basically a very expensive piece of paper that says I can Google things really fast." },
  { category: 'College', joke: "During exams, students look up for inspiration, down in desperation, and left and right for information." },
  { category: 'College', joke: "Professor: 'Are there any questions?' *Dead silence* Professor: 'Great, let's move on.' Students: *Internal screaming*" },

  // Engineering
  { category: 'Engineering', joke: "To the optimist, the glass is half full. To the pessimist, the glass is half empty. To the engineer, the glass is twice as big as it needs to be." },
  { category: 'Engineering', joke: "What's the difference between mechanical engineers and civil engineers? Mechanical engineers build weapons; civil engineers build targets." },
  { category: 'Engineering', joke: "An engineer's motto: If it isn't broken, take it apart and see why." },
  { category: 'Engineering', joke: "How do you estimate the completion date of an engineering project? Double the estimate, change the unit to the next highest, and add 5." },
  { category: 'Engineering', joke: "Why did the structural engineer break up with the architect? There was no support in their relationship." },

  // Technology
  { category: 'Technology', joke: "There are three constants in life: death, taxes, and software updates at the worst possible time." },
  { category: 'Technology', joke: "Why did the computer go to the doctor? Because it had a virus!" },
  { category: 'Technology', joke: "What is a computer's favorite snack? Microchips!" },
  { category: 'Technology', joke: "Why did the Wi-Fi router get married? Because they had a great connection." },
  { category: 'Technology', joke: "Cloud computing is basically just using someone else's computer to store your bugs." },

  // Relationship
  { category: 'Relationship', joke: "My wife told me to stop impersonating a flamingo. I had to put my foot down." },
  { category: 'Relationship', joke: "Are you made of copper and tellurium? Because you're CuTe." },
  { category: 'Relationship', joke: "I asked my date if she wanted to see a movie, but she said she had already seen it. So we sat in silence for two hours." },
  { category: 'Relationship', joke: "My boyfriend said I'm too dramatic. I didn't say anything, I just gasped and fell onto the fainting couch." },
  { category: 'Relationship', joke: "A relationship is like a walk in the park. Jurassic Park." },

  // Animals
  { category: 'Animals', joke: "What do you call a sleeping dinosaur? A dino-snore!" },
  { category: 'Animals', joke: "Why do cows wear bells? Because their horns don't work!" },
  { category: 'Animals', joke: "What do you call a bear with no teeth? A gummy bear!" },
  { category: 'Animals', joke: "Why did the pony get sent to his room? He wouldn't stop horsing around." },
  { category: 'Animals', joke: "What do you call a fish with no eyes? A fsh." },

  // Puns
  { category: 'Puns', joke: "I used to be a banker, but I lost interest." },
  { category: 'Puns', joke: "I'm glad I know sign language. It's pretty handy." },
  { category: 'Puns', joke: "What did the grape say when it got stepped on? Nothing, it just let out a little wine." },
  { category: 'Puns', joke: "I've just written a song about tortillas. Actually, it's more of a wrap." },
  { category: 'Puns', joke: "The rotation of Earth really makes my day." },

  // Random
  { category: 'Random', joke: "I ordered a chicken and an egg from Amazon. I'll let you know." },
  { category: 'Random', joke: "I asked the librarian if they had books on paranoia. She whispered, 'They're right behind you!'" },
  { category: 'Random', joke: "Parallel lines have so much in common. It's a shame they'll never meet." },
  { category: 'Random', joke: "I told my doctor that I broke my arm in two places. He told me to stop going to those places." },
  { category: 'Random', joke: "I used to play piano by ear, but now I use my hands." }
];

async function seed() {
  try {
    logger.info('Initializing database for seeding...');
    await db.connect();

    let insertedCount = 0;
    for (const item of jokesList) {
      try {
        await jokeRepository.insertJoke(item.joke, item.category);
        insertedCount++;
      } catch (err) {
        // Skip uniqueness constraint violations quietly or log them
        if (!err.message.includes('UNIQUE constraint failed')) {
          logger.error('Failed to seed joke "%s": %s', item.joke, err.message);
        }
      }
    }

    const counts = await jokeRepository.getCounts();
    logger.info('Seeding finished successfully. Attempted inserts: %d. Current database count: %d.', insertedCount, counts.total);
  } catch (error) {
    logger.error('Seeding script failed: %s', error.message);
  } finally {
    await db.close();
  }
}

seed();
