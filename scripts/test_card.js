require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generateJokeCard } = require('../src/utils/imageGenerator');

const jokes = [
  { id: 1,  category: 'daily life',  joke: 'Adult banna matlab khud hi bill bharna aur khud hi rona.',                              highlights: ['khud hi rona'] },
  { id: 2,  category: 'office',      joke: 'Boss ne bola "great work team" — team ne socha "raise milega" — boss ne socha "bas itna hi kaafi hai".', highlights: ['bas itna hi kaafi hai'] },
  { id: 3,  category: 'programming', joke: 'Programmer ki life: 1% coding, 99% Stack Overflow pe copy paste.',                       highlights: ['99%', 'copy paste'] },
];

const outDir = path.join(__dirname, '../test_cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

(async () => {
  for (const j of jokes) {
    console.log(`Generating card ${j.id}...`);
    const buf = await generateJokeCard(j);
    fs.writeFileSync(path.join(outDir, `joke_card_${j.id}.png`), buf);
  }
  console.log('Done! Saved to test_cards/');
})();
