const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const logger = require('./logger');

// Register the Bricolage Grotesque font on load
const fontPath = path.join(__dirname, '../assets/BricolageGrotesque.ttf');
try {
  GlobalFonts.registerFromPath(fontPath, 'BricolageGrotesque');
  logger.info('Bricolage Grotesque font registered successfully for Canvas.');
} catch (err) {
  logger.error('Failed to register Bricolage Grotesque font: %s', err.message);
}

/**
 * Draw a rounded rectangle path on the canvas context.
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw a clean vector heart.
 */
function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  // Left curve
  ctx.quadraticCurveTo(x, y - size/12, x - size / 2, y - size/12);
  ctx.quadraticCurveTo(x - size, y - size/12, x - size, y + size / 3);
  ctx.quadraticCurveTo(x - size, y + (size * 2) / 3, x, y + size);
  // Right curve
  ctx.quadraticCurveTo(x + size, y + (size * 2) / 3, x + size, y + size / 3);
  ctx.quadraticCurveTo(x + size, y - size/12, x + size / 2, y - size/12);
  ctx.quadraticCurveTo(x, y - size/12, x, y + size / 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Wrap text into lines of maximum width.
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Helper to draw a crescent moon.
 */
function drawCrescentMoon(ctx, x, y, radius, color, bgColor) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw overlapping circle offset to create crescent
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(x + radius * 0.4, y - radius * 0.3, radius * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Helper to draw a simple 4-point star.
 */
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/**
 * Theme 1: Dark Board Quote Theme
 */
function drawDarkBoardTheme(ctx, jokeText, category) {
  // Radial Gradient Background
  const grad = ctx.createRadialGradient(512, 512, 100, 512, 512, 700);
  grad.addColorStop(0, '#0f172a'); // slate-900
  grad.addColorStop(1, '#020617'); // slate-950
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Header Lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 120);
  ctx.lineTo(430, 120);
  ctx.moveTo(594, 120);
  ctx.lineTo(874, 120);
  ctx.stroke();

  // Smiley Face
  const smileyX = 512;
  const smileyY = 120;
  const smileyRad = 24;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(smileyX, smileyY, smileyRad, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(smileyX - 8, smileyY - 6, 3, 0, Math.PI * 2);
  ctx.arc(smileyX + 8, smileyY - 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(smileyX, smileyY + 2, 10, 0, Math.PI);
  ctx.stroke();

  // Category Title
  ctx.fillStyle = '#fbbf24';
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.toUpperCase() + ' JOKE', 512, 190);

  // Quote Box
  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 24);
  ctx.stroke();

  // Corner Quote Badges
  const quoteRadius = 32;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(boxX, boxY, quoteRadius, 0, Math.PI * 2);
  ctx.arc(boxX + boxWidth, boxY + boxHeight, quoteRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 64px "BricolageGrotesque"';
  ctx.fillText('“', boxX, boxY + 22);
  ctx.fillText('”', boxX + boxWidth, boxY + boxHeight - 2);

  // Draw Text
  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, '#ffffff', 48);

  // Footer Divider & Watermark
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(350, 870);
  ctx.lineTo(674, 870);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '800 22px "BricolageGrotesque"';
  ctx.fillText('@jokerryan.bsky.social', 512, 915);
}

/**
 * Theme 2: Comic Orange Theme
 */
function drawComicOrangeTheme(ctx, jokeText, category) {
  // Vibrant Orange/Yellow Gradient
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#f97316'); // orange-500
  grad.addColorStop(1, '#facc15'); // yellow-400
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Comic Dots/Accents (Draw some simple dots)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let x = 40; x < 1000; x += 60) {
    for (let y = 40; y < 1000; y += 60) {
      if ((x + y) % 3 === 0) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // LOL Bubble in Header
  const bubbleX = 512;
  const bubbleY = 130;
  const bubbleW = 160;
  const bubbleH = 65;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, bubbleX - bubbleW/2, bubbleY - bubbleH/2, bubbleW, bubbleH, 16);
  ctx.fill();
  ctx.stroke();
  
  // Triangle pointing down
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(bubbleX - 15, bubbleY + bubbleH/2);
  ctx.lineTo(bubbleX + 15, bubbleY + bubbleH/2);
  ctx.lineTo(bubbleX, bubbleY + bubbleH/2 + 15);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bubbleX - 15, bubbleY + bubbleH/2);
  ctx.lineTo(bubbleX, bubbleY + bubbleH/2 + 15);
  ctx.lineTo(bubbleX + 15, bubbleY + bubbleH/2);
  ctx.stroke();

  // LOL Text (No emojis to prevent ? rendering)
  ctx.fillStyle = '#000000';
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.fillText('LOL!', bubbleX, bubbleY);

  // Speech Box for Joke
  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 32);
  ctx.fill();
  ctx.stroke();

  // Comic Star Accents
  drawStar(ctx, 80, 200, 4, 25, 10, '#000000');
  drawStar(ctx, 944, 200, 4, 25, 10, '#000000');
  drawStar(ctx, 80, 800, 4, 25, 10, '#000000');
  drawStar(ctx, 944, 800, 4, 25, 10, '#000000');

  // Draw Text
  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, '#000000', 46);

  // Footer
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 870);
  ctx.lineTo(674, 870);
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.font = '800 24px "BricolageGrotesque"';
  ctx.fillText('@jokerryan.bsky.social', 512, 915);
}

/**
 * Theme 3: Cute Pastel Theme
 */
function drawPastelCuteTheme(ctx, jokeText, category) {
  // Soft Cream Background
  ctx.fillStyle = '#fefefe';
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft Pastel Corner Blobs/Circles
  ctx.save();
  ctx.globalAlpha = 0.55;
  // Top-Left Soft Peach
  ctx.fillStyle = '#fbcfe8'; // pink-200
  ctx.beginPath();
  ctx.arc(80, 80, 180, 0, Math.PI * 2);
  ctx.fill();
  // Top-Right Soft Yellow
  ctx.fillStyle = '#fef08a'; // yellow-200
  ctx.beginPath();
  ctx.arc(944, 80, 150, 0, Math.PI * 2);
  ctx.fill();
  // Bottom-Left Soft Green
  ctx.fillStyle = '#bbf7d0'; // green-200
  ctx.beginPath();
  ctx.arc(80, 944, 160, 0, Math.PI * 2);
  ctx.fill();
  // Bottom-Right Soft Orange
  ctx.fillStyle = '#fed7aa'; // orange-200
  ctx.beginPath();
  ctx.arc(944, 944, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cute Vector Smiley Face in Header (Replaces the unicode 'ᵔ◡ᵔ' which showed as '?')
  const smileyX = 512;
  const smileyY = 110;
  ctx.save();
  ctx.strokeStyle = '#db2777'; // pink-500
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  // Left eye arc
  ctx.beginPath();
  ctx.arc(smileyX - 14, smileyY - 2, 8, Math.PI, 0, false);
  ctx.stroke();
  // Right eye arc
  ctx.beginPath();
  ctx.arc(smileyX + 14, smileyY - 2, 8, Math.PI, 0, false);
  ctx.stroke();
  // Mouth arc
  ctx.beginPath();
  ctx.arc(smileyX, smileyY + 6, 6, 0, Math.PI, false);
  ctx.stroke();
  ctx.restore();

  // Header text
  ctx.fillStyle = '#475569'; // slate-600
  ctx.font = '800 28px "BricolageGrotesque"';
  ctx.fillText(category.toUpperCase(), 512, 175);

  // Rounded Box with Cute Dashed Outline
  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 36);
  ctx.fill();

  ctx.strokeStyle = '#db2777'; // pink-600
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]); // dashed border
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 36);
  ctx.stroke();
  ctx.setLineDash([]); // reset dash

  // Cute vector hearts in corners (Replaces unicode '♥' which showed as '?')
  drawHeart(ctx, boxX + 45, boxY + 35, 20, '#db2777');
  drawHeart(ctx, boxX + boxWidth - 45, boxY + boxHeight - 55, 20, '#db2777');

  // Draw Text
  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, '#1e293b', 44);

  // Footer
  ctx.strokeStyle = 'rgba(219, 39, 119, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(350, 870);
  ctx.lineTo(674, 870);
  ctx.stroke();

  ctx.fillStyle = '#db2777';
  ctx.font = '800 22px "BricolageGrotesque"';
  ctx.fillText('@jokerryan.bsky.social', 512, 915);
}

/**
 * Theme 4: Cozy Night Sky Theme
 */
function drawNightSkyTheme(ctx, jokeText, category) {
  // Midnight Gradient Background
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#1e1b4b'); // indigo-950
  grad.addColorStop(1, '#030712'); // grey-950
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Draw background stars
  ctx.fillStyle = '#fef08a';
  for (let i = 0; i < 24; i++) {
    const starX = Math.sin(i) * 450 + 512;
    const starY = Math.cos(i * 1.5) * 450 + 512;
    // Don't draw stars inside the main quote box
    if (starX < 140 || starX > 880 || starY < 280 || starY > 760) {
      drawStar(ctx, starX, starY, 4, 6, 2, '#fde047');
    }
  }

  // Crescent Moon at Top Left
  drawCrescentMoon(ctx, 160, 130, 40, '#fde047', '#1e1b4b');

  // Header Title with vector stars on both sides (Replaces the unicode '✦' which showed as '?')
  const titleText = category.toUpperCase();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, 512, 150);

  // Draw stars flanking the text
  const textWidth = ctx.measureText(titleText).width;
  drawStar(ctx, 512 - textWidth / 2 - 25, 150, 4, 8, 3, '#fde047');
  drawStar(ctx, 512 + textWidth / 2 + 25, 150, 4, 8, 3, '#fde047');

  // Quote Box
  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 28);
  ctx.stroke();

  // Glowing quotation marks (Standard ASCII quotes scaled up, fully supported by font)
  ctx.fillStyle = '#fde047';
  ctx.font = '800 64px "BricolageGrotesque"';
  ctx.fillText('“', boxX + 45, boxY + 65);
  ctx.fillText('”', boxX + boxWidth - 45, boxY + boxHeight - 35);

  // Draw Text
  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, '#ffffff', 44);

  // Footer
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(350, 870);
  ctx.lineTo(674, 870);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.font = '800 22px "BricolageGrotesque"';
  ctx.fillText('@jokerryan.bsky.social', 512, 915);
}

/**
 * Text renderer helper to wrap, calculate heights and vertical center.
 */
function drawWrappedJokeText(ctx, text, boxY, boxHeight, color, defaultFontSize) {
  let fontSize = defaultFontSize;
  if (text.length > 180) fontSize = Math.floor(defaultFontSize * 0.75);
  else if (text.length > 120) fontSize = Math.floor(defaultFontSize * 0.85);
  else if (text.length > 70) fontSize = Math.floor(defaultFontSize * 0.95);

  ctx.font = `800 ${fontSize}px "BricolageGrotesque"`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxTextWidth = 620; // safety padding inside the box
  const lines = wrapText(ctx, text, maxTextWidth);

  const lineHeight = fontSize * 1.4;
  const totalTextHeight = lines.length * lineHeight;
  const startY = boxY + (boxHeight - totalTextHeight) / 2 + lineHeight / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 512, startY + i * lineHeight);
  }
}

/**
 * Dynamically generates a beautiful 1024x1024 PNG image card for a joke.
 * Rotates between 4 distinct designs based on joke ID.
 * 
 * @param {Object} jokeObj - The joke object containing `id`, `joke` and `category`
 * @returns {Promise<Buffer>} - Resolves to a PNG buffer
 */
async function generateJokeCard(jokeObj) {
  try {
    const canvas = createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');

    const jokeId = jokeObj.id || 1;
    const category = jokeObj.category || 'JOKE';
    const text = jokeObj.joke;

    // Rotate theme using joke ID modulo 4
    const themeIndex = jokeId % 4;

    switch (themeIndex) {
      case 0:
        logger.info('Generating card using Theme: Dark Board...');
        drawDarkBoardTheme(ctx, text, category);
        break;
      case 1:
        logger.info('Generating card using Theme: Comic Orange...');
        drawComicOrangeTheme(ctx, text, category);
        break;
      case 2:
        logger.info('Generating card using Theme: Cute Pastel...');
        drawPastelCuteTheme(ctx, text, category);
        break;
      case 3:
      default:
        logger.info('Generating card using Theme: Cozy Night Sky...');
        drawNightSkyTheme(ctx, text, category);
        break;
    }

    // Output as PNG buffer
    const buffer = canvas.toBuffer('image/png');
    return buffer;
  } catch (error) {
    logger.error('Failed to generate joke card image: %s', error.stack);
    throw error;
  }
}

module.exports = {
  generateJokeCard
};
