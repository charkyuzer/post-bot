const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const ASSETS = path.join(__dirname, '../assets');
try {
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Inter_24pt-Bold.ttf'),    'InterBold');
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Inter_24pt-Medium.ttf'),  'InterMedium');
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Inter_24pt-Regular.ttf'), 'InterRegular');
} catch (err) {
  logger.error('Font registration failed: %s', err.message);
}

const BG_DIR = path.join(__dirname, '../assets/backgrounds');

const CATEGORY_BG = {
  'daily life':     'daily_life.png',
  'indian parents': 'indian_family.png',
  'indian family':  'indian_family.png',
  'family':         'indian_family.png',
  'office':         'office.png',
  'corporate':      'office.png',
  'programming':    'programming.png',
  'college':        'college.png',
  'student':        'college.png',
  'relationships':  'relationships.png',
  'relationship':   'relationships.png',
  'social media':   'social_media.png',
  'internet':       'social_media.png',
  'money':          'money.png',
  'shopping':       'money.png',
  'food':           'food.png',
  'gaming':         'gaming.png',
};

const FALLBACK_BGS = Array.from({ length: 15 }, (_, i) => `bg${i}.png`);

function getBgPath(category, jokeId) {
  const key = (category || '').toLowerCase().trim();
  const filename = CATEGORY_BG[key];
  if (filename) {
    const p = path.join(BG_DIR, filename);
    if (fs.existsSync(p)) return p;
  }
  return path.join(BG_DIR, FALLBACK_BGS[jokeId % FALLBACK_BGS.length]);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = cur + ' ' + words[i];
    if (ctx.measureText(test).width < maxWidth) cur = test;
    else { lines.push(cur); cur = words[i]; }
  }
  lines.push(cur);
  return lines;
}

function drawJokeText(ctx, text, centerY, color, fontSize, maxWidth) {
  ctx.save();
  ctx.font = `700 ${fontSize}px "InterBold"`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 18;

  const lines = wrapText(ctx, text, maxWidth);
  const lh = fontSize * 1.55;
  const totalH = lines.length * lh;
  const startY = centerY - totalH / 2 + lh / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line.trim(), 512, startY + i * lh);
  });
  ctx.restore();
}

function getFontSize(text) {
  if (text.length > 220) return 36;
  if (text.length > 160) return 42;
  if (text.length > 100) return 48;
  if (text.length > 60)  return 54;
  return 60;
}

async function generateJokeCard(jokeObj) {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  const jokeId   = jokeObj.id || 1;
  const category = (jokeObj.category || 'random').toLowerCase().trim();
  const text     = jokeObj.joke;

  // 1. Draw background image
  const bgPath = getBgPath(category, jokeId);
  try {
    const bgImg = await loadImage(bgPath);
    ctx.drawImage(bgImg, 0, 0, 1024, 1024);
  } catch (e) {
    logger.error('BG load failed: %s', e.message);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 1024, 1024);
  }

  // 2. Top solid black fading into bg, subtle overall darkening
  ctx.fillStyle = 'rgba(5,11,20,0.20)';
  ctx.fillRect(0, 0, 1024, 1024);
  const topFade = ctx.createLinearGradient(0, 0, 0, 340);
  topFade.addColorStop(0,    'rgba(0,0,0,0.95)');
  topFade.addColorStop(0.6,  'rgba(0,0,0,0.40)');
  topFade.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, 1024, 340);

  // 3. Premium grain texture overlay
  ctx.save();
  ctx.globalAlpha = 0.045;
  for (let i = 0; i < 18000; i++) {
    const gx = Math.random() * 1024;
    const gy = Math.random() * 1024;
    const gb = Math.random() * 255;
    ctx.fillStyle = `rgb(${gb},${gb},${gb})`;
    ctx.fillRect(gx, gy, 1, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // 4. Category — clean spaced text + rounded gold underline
  const catText = category.toUpperCase();
  ctx.save();
  ctx.font = '700 30px "InterBold"';
  ctx.fillStyle = '#F5F5F5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 10;
  ctx.letterSpacing = '5px';
  ctx.fillText(catText, 512, 66);
  // Rounded white underline
  const catTW = ctx.measureText(catText).width + 80;
  const lineX1 = 512 - catTW / 2;
  const lineX2 = 512 + catTW / 2;
  ctx.strokeStyle = '#F5F5F5';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(lineX1, 92);
  ctx.lineTo(lineX2, 92);
  ctx.stroke();
  // 2 dots on each end with gap and faded texture
  [[lineX1 - 14, 0.9], [lineX1 - 28, 0.45], [lineX2 + 14, 0.9], [lineX2 + 28, 0.45]].forEach(([dx, alpha]) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#F5F5F5';
    ctx.beginPath();
    ctx.arc(dx, 92, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // 5. Glassmorphism joke card — true center
  const cardW = 864, cardH = 460;
  const cardX = (1024 - cardW) / 2;
  const cardY = (1024 - cardH) / 2;

  ctx.save();
  // Dark tinted glass
  ctx.fillStyle = 'rgba(5,11,20,0.58)';
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fill();
  // Thin elegant border
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.stroke();
  // Top highlight
  ctx.strokeStyle = 'rgba(200,164,93,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, cardY + 1);
  ctx.lineTo(cardX + cardW - 40, cardY + 1);
  ctx.stroke();
  ctx.restore();

  // 6. Joke text — centered inside card
  const fontSize = getFontSize(text);
  drawJokeText(ctx, text, cardY + cardH / 2, '#F5F5F5', fontSize, cardW - 100);

  // 7. Footer — username center, like/share below
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 8;
  ctx.font = '400 20px "InterRegular"';
  ctx.fillStyle = 'rgba(245,245,245,0.90)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@jokerryan.bsky.social', 512, 930);
  ctx.font = '400 14px "InterRegular"';
  ctx.fillStyle = 'rgba(160,160,160,0.70)';
  ctx.fillText('Like  ·  Share  ·  Follow', 512, 958);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

module.exports = { generateJokeCard };
