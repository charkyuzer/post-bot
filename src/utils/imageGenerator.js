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
 * Draw a beautiful 4-point star.
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
 * Draw a custom vector Tears-of-Joy Emoji 😂.
 */
function drawLaughingEmoji(ctx, x, y, radius) {
  ctx.save();
  // Face yellow circle
  ctx.fillStyle = '#fbbf24'; // yellow-400
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d97706'; // amber-600
  ctx.lineWidth = 3;
  ctx.stroke();

  // Closed laughing eyes (v-shape ^ ^)
  ctx.strokeStyle = '#78350f'; // amber-900
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  
  // Left eye
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.45, y - radius * 0.1);
  ctx.lineTo(x - radius * 0.25, y - radius * 0.3);
  ctx.lineTo(x - radius * 0.05, y - radius * 0.1);
  ctx.stroke();

  // Right eye
  ctx.beginPath();
  ctx.moveTo(x + radius * 0.05, y - radius * 0.1);
  ctx.lineTo(x + radius * 0.25, y - radius * 0.3);
  ctx.lineTo(x + radius * 0.45, y - radius * 0.1);
  ctx.stroke();

  // Wide open laughing mouth
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.1, radius * 0.5, 0, Math.PI);
  ctx.fill();

  // Teeth (white top bar in mouth)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - radius * 0.35, y + radius * 0.1, radius * 0.7, radius * 0.12);

  // Tongue
  ctx.fillStyle = '#f43f5e'; // rose-500
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.45, radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Tears of Joy (blue drops on sides)
  ctx.fillStyle = '#3b82f6'; // blue-500
  
  // Left tear
  ctx.beginPath();
  ctx.arc(x - radius * 0.6, y, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.85, y);
  ctx.lineTo(x - radius * 0.6, y - radius * 0.45);
  ctx.lineTo(x - radius * 0.35, y);
  ctx.closePath();
  ctx.fill();

  // Right tear
  ctx.beginPath();
  ctx.arc(x + radius * 0.6, y, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + radius * 0.35, y);
  ctx.lineTo(x + radius * 0.6, y - radius * 0.45);
  ctx.lineTo(x + radius * 0.85, y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a custom vector Flame Emoji 🔥.
 */
function drawFlameEmoji(ctx, x, y, size) {
  ctx.save();
  // Outer red flame
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(x, y + size/2);
  ctx.bezierCurveTo(x - size/2, y + size/2, x - size/2, y - size/4, x - size/6, y - size/2);
  ctx.bezierCurveTo(x - size/3, y - size/8, x - size/12, y, x, y - size/3);
  ctx.bezierCurveTo(x + size/12, y - size/2, x + size/3, y - size/8, x + size/6, y - size/2);
  ctx.bezierCurveTo(x + size/2, y - size/4, x + size/2, y + size/2, x, y + size/2);
  ctx.fill();

  // Middle orange flame
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(x, y + size/2);
  ctx.bezierCurveTo(x - size/3, y + size/2, x - size/3, y, x - size/12, y - size/4);
  ctx.bezierCurveTo(x - size/6, y - size/16, x - size/24, y - size/12, x, y - size/6);
  ctx.bezierCurveTo(x + size/24, y - size/4, x + size/6, y - size/16, x + size/12, y - size/4);
  ctx.bezierCurveTo(x + size/3, y, x + size/3, y + size/2, x, y + size/2);
  ctx.fill();

  // Inner yellow core
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(x, y + size/2);
  ctx.bezierCurveTo(x - size/5, y + size/2, x - size/5, y + size/6, x, y - size/12);
  ctx.bezierCurveTo(x + size/5, y + size/6, x + size/5, y + size/2, x, y + size/2);
  ctx.fill();
  ctx.restore();
}

/**
 * Wrap text respecting explicit newline character formatting to keep it fully aligned.
 */
function wrapText(ctx, text, maxWidth) {
  const paragraphs = text.split('\n');
  const allLines = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    if (words.length === 0 || words[0] === '') {
      allLines.push('');
      continue;
    }
    
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        allLines.push(currentLine);
        currentLine = word;
      }
    }
    allLines.push(currentLine);
  }
  return allLines;
}

/**
 * Centralized Text Renderer helper with perfect center alignment.
 */
function drawWrappedJokeText(ctx, text, boxY, boxHeight, color, defaultFontSize) {
  let fontSize = defaultFontSize;
  if (text.length > 180) fontSize = Math.floor(defaultFontSize * 0.70);
  else if (text.length > 120) fontSize = Math.floor(defaultFontSize * 0.82);
  else if (text.length > 70) fontSize = Math.floor(defaultFontSize * 0.92);

  ctx.save();
  ctx.font = `800 ${fontSize}px "BricolageGrotesque"`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxTextWidth = 620; // safety padding inside the box
  const lines = wrapText(ctx, text, maxTextWidth);

  const lineHeight = fontSize * 1.45;
  const totalTextHeight = lines.length * lineHeight;
  const startY = boxY + (boxHeight - totalTextHeight) / 2 + lineHeight / 2;

  for (let i = 0; i < lines.length; i++) {
    // Trim leading/trailing spaces for perfect centering
    const lineText = lines[i].trim();
    if (lineText) {
      ctx.fillText(lineText, 512, startY + i * lineHeight);
    }
  }
  ctx.restore();
}

/**
 * Premium 2-line footer: divider + CTA icons + handle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} dividerColor  - Color for the divider line
 * @param {string} ctaColor      - Color for "Like Share Follow" text
 * @param {string} handleColor   - Color for "@handle" text
 */
function drawFooter(ctx, dividerColor, ctaColor, handleColor) {
  // Divider line
  ctx.save();
  ctx.strokeStyle = dividerColor || 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, 878);
  ctx.lineTo(904, 878);
  ctx.stroke();

  // CTA text: left-aligned
  ctx.font = '700 22px "BricolageGrotesque"';
  ctx.fillStyle = ctaColor || '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Like  |  Share  |  Follow', 130, 910);

  // Handle text: right-aligned
  ctx.font = '700 22px "BricolageGrotesque"';
  ctx.fillStyle = handleColor || 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('@jokerryan.bsky.social', 895, 910);
  ctx.restore();
}

// ==========================================
// 12 PREMIUM DESIGN THEMES
// ==========================================

// Theme 0: Dark Board (Deep Slate & Yellow Quote Badges)
function drawDarkBoardTheme(ctx, jokeText, category, jokeId) {
  const grad = ctx.createRadialGradient(512, 512, 100, 512, 512, 700);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#020617');
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

  // Smiley face
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(512, 120, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(504, 114, 3, 0, Math.PI * 2);
  ctx.arc(520, 114, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(512, 122, 10, 0, Math.PI);
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.toUpperCase() + ' JOKE', 512, 190);

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 24);
  ctx.stroke();

  const quoteRadius = 32;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(boxX, boxY, quoteRadius, 0, Math.PI * 2);
  ctx.arc(boxX + boxWidth, boxY + boxHeight, quoteRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 64px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('“', boxX, boxY + 22);
  ctx.fillText('”', boxX + boxWidth, boxY + boxHeight - 2);

  // Dynamic text color variation: White, light amber, or light cyan
  const colors = ['#ffffff', '#fef3c7', '#e0f2fe'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 48);
  drawFooter(ctx, '#334155', '#fbbf24', '#94a3b8');
}

// Theme 1: Comic Orange (Vibrant Comic Book Speech theme)
function drawComicOrangeTheme(ctx, jokeText, category, jokeId) {
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(1, '#facc15');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Dots pattern
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

  // LOL Bubble
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 432, 97, 160, 65, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(497, 162);
  ctx.lineTo(527, 162);
  ctx.lineTo(512, 177);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(497, 162);
  ctx.lineTo(512, 177);
  ctx.lineTo(527, 162);
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LOL!', 512, 130);

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

  // Vector Laughing emoji drawing in corners
  drawLaughingEmoji(ctx, 80, 200, 26);
  drawLaughingEmoji(ctx, 944, 800, 26);

  // Dynamic text color variation: Charcoal Black, Dark Blue, or Deep Brown
  const colors = ['#000000', '#1e293b', '#451a03'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 46);
  drawFooter(ctx, '#000000', '#000000', '#525252');
}

// Theme 2: Cute Pastel (Pink Dashed Box, Hearts & Face)
function drawPastelCuteTheme(ctx, jokeText, category, jokeId) {
  ctx.fillStyle = '#fefefe';
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft Pastel blobs
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath(); ctx.arc(80, 80, 180, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.beginPath(); ctx.arc(944, 80, 150, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#bbf7d0';
  ctx.beginPath(); ctx.arc(80, 944, 160, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath(); ctx.arc(944, 944, 190, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // Cute face header
  ctx.strokeStyle = '#db2777';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(498, 108, 8, Math.PI, 0, false); ctx.stroke();
  ctx.beginPath(); ctx.arc(526, 108, 8, Math.PI, 0, false); ctx.stroke();
  ctx.beginPath(); ctx.arc(512, 116, 6, 0, Math.PI, false); ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '800 28px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.toUpperCase(), 512, 175);

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 36);
  ctx.fill();

  ctx.strokeStyle = '#db2777';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 36);
  ctx.stroke();
  ctx.setLineDash([]);

  // Hearts
  drawHeart(ctx, boxX + 45, boxY + 35, 20, '#db2777');
  drawHeart(ctx, boxX + boxWidth - 45, boxY + boxHeight - 55, 20, '#db2777');

  // Dynamic text color variation: Slate, Deep Purple, or Dark Forest Green
  const colors = ['#1e293b', '#4c1d95', '#064e3b'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, '#fbcfe8', '#db2777', '#9d174d');
}

// Theme 3: Cozy Night Sky (Stars & Crescent Moon)
function drawNightSkyTheme(ctx, jokeText, category, jokeId) {
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#1e1b4b');
  grad.addColorStop(1, '#030712');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Background stars
  for (let i = 0; i < 24; i++) {
    const starX = Math.sin(i) * 450 + 512;
    const starY = Math.cos(i * 1.5) * 450 + 512;
    if (starX < 140 || starX > 880 || starY < 280 || starY > 760) {
      drawStar(ctx, starX, starY, 4, 6, 2, '#fde047');
    }
  }

  // Moon
  drawCrescentMoon(ctx, 160, 130, 40, '#fde047', '#1e1b4b');

  const titleText = category.toUpperCase();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, 512, 150);

  const textWidth = ctx.measureText(titleText).width;
  drawStar(ctx, 512 - textWidth / 2 - 25, 150, 4, 8, 3, '#fde047');
  drawStar(ctx, 512 + textWidth / 2 + 25, 150, 4, 8, 3, '#fde047');

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 28);
  ctx.stroke();

  ctx.fillStyle = '#fde047';
  ctx.font = '800 64px "BricolageGrotesque"';
  ctx.fillText('“', boxX + 45, boxY + 65);
  ctx.fillText('”', boxX + boxWidth - 45, boxY + boxHeight - 35);

  // Dynamic text color: White, soft yellow, or light mint green
  const colors = ['#ffffff', '#fef08a', '#d1fae5'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, 'rgba(255,255,255,0.2)', '#e2e8f0', '#94a3b8');
}

// Theme 4: Sunset Silhouette (Red-Orange-Purple Gradient & Silhouette Sun)
function drawSunsetTheme(ctx, jokeText, category, jokeId) {
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#701a75'); // fuchsia-900
  grad.addColorStop(0.5, '#be123c'); // rose-700
  grad.addColorStop(1, '#f59e0b'); // amber-500
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Big Glowing Sun at Header
  ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
  ctx.beginPath(); ctx.arc(512, 130, 80, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
  ctx.beginPath(); ctx.arc(512, 130, 50, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.toUpperCase(), 512, 130);

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;
  // Glassmorphic semi-transparent black container
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 24);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 24);
  ctx.stroke();

  // Sun icon decoration
  drawStar(ctx, boxX + boxWidth - 50, boxY + 45, 4, 15, 6, '#fde047');

  // Dynamic text color: pure white, light sunset peach, or warm yellow
  const colors = ['#ffffff', '#fed7aa', '#fef08a'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, 'rgba(255,255,255,0.15)', '#fde68a', '#fcd9a8');
}

// Theme 5: Cyberpunk Neon (Glowing Cyan & Magenta Borders)
function drawCyberpunkTheme(ctx, jokeText, category, jokeId) {
  ctx.fillStyle = '#09090b'; // zinc-950
  ctx.fillRect(0, 0, 1024, 1024);

  // Neon grid lines at the very bottom
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)'; // pink-500
  ctx.lineWidth = 2;
  for (let x = 0; x <= 1024; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 850);
    ctx.lineTo(x + (x - 512)*2, 1024);
    ctx.stroke();
  }

  // Header Title
  ctx.fillStyle = '#06b6d4'; // cyan-500
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('// ' + category.toUpperCase(), 512, 140);

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;

  // Dual Neon Glow Borders: Magenta Offset
  ctx.strokeStyle = '#ec4899'; // pink-500
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX - 4, boxY - 4, boxWidth, boxHeight, 20);
  ctx.stroke();

  // Cyan Offset
  ctx.strokeStyle = '#06b6d4'; // cyan-500
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX + 4, boxY + 4, boxWidth, boxHeight, 20);
  ctx.stroke();

  // Flame Emoji in corner
  drawFlameEmoji(ctx, boxX + 35, boxY + 35, 30);

  // Dynamic text color variation: Cyan, Neon Pink, or Neon Green
  const colors = ['#06b6d4', '#f43f5e', '#a3e635'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, '#ec4899', '#06b6d4', '#6b7280');
}

// Theme 6: Matrix Hacker (Neon Green Matrix rain theme)
function drawMatrixTheme(ctx, jokeText, category, jokeId) {
  ctx.fillStyle = '#022c22'; // deep green-950
  ctx.fillRect(0, 0, 1024, 1024);

  // Matrix code rain effect
  ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'; // green-500
  for (let x = 32; x < 1024; x += 64) {
    for (let y = 32; y < 1024; y += 80) {
      if ((x*y) % 5 === 0) {
        ctx.font = '20px monospace';
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', x, y);
      }
    }
  }

  // Header Title
  ctx.fillStyle = '#22c55e'; // green-500
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SYSTEM.OUT.PRINT(' + category.toUpperCase() + ')', 512, 140);

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 16);
  ctx.stroke();

  // Matrix corners
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(boxX - 10, boxY - 10, 30, 8);
  ctx.fillRect(boxX - 10, boxY - 10, 8, 30);
  ctx.fillRect(boxX + boxWidth - 20, boxY - 10, 30, 8);
  ctx.fillRect(boxX + boxWidth + 2, boxY - 10, 8, 30);

  // Dynamic text color variation: Neon Green, Matrix Light Green, or Emerald
  const colors = ['#22c55e', '#4ade80', '#34d399'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, '#16a34a', '#4ade80', '#15803d');
}

// Theme 7: Forest Nature (Emerald/Mint theme with leaf details)
function drawForestTheme(ctx, jokeText, category, jokeId) {
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#064e3b'); // green-900
  grad.addColorStop(1, '#022c22'); // green-950
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft glowing mint circle in center
  ctx.fillStyle = 'rgba(187, 247, 208, 0.05)'; // green-200
  ctx.beginPath(); ctx.arc(512, 512, 400, 0, Math.PI*2); ctx.fill();

  // Header Title
  ctx.fillStyle = '#a7f3d0'; // green-200
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✿  ' + category.toUpperCase() + '  ✿', 512, 140);

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;

  ctx.strokeStyle = '#34d399'; // green-400
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 28);
  ctx.stroke();

  // Leaf details (vector heart in mint)
  drawHeart(ctx, boxX, boxY, 16, '#34d399');
  drawHeart(ctx, boxX + boxWidth, boxY + boxHeight, 16, '#34d399');

  // Dynamic text color variation: Pure White, Soft Mint, or Light Yellow
  const colors = ['#ffffff', '#a7f3d0', '#fef08a'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, '#34d399', '#a7f3d0', '#6ee7b7');
}

// Theme 8: Cozy Coffee (Chocolate & Cream warm café design)
function drawCoffeeTheme(ctx, jokeText, category, jokeId) {
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#451a03'); // brown-900
  grad.addColorStop(1, '#1c1917'); // stone-900
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Coffee cup vector at header
  const cupX = 512;
  const cupY = 125;
  ctx.fillStyle = '#fed7aa'; // orange-200
  ctx.beginPath();
  // Cup body
  ctx.arc(cupX, cupY + 10, 20, 0, Math.PI);
  ctx.fill();
  // Handle
  ctx.strokeStyle = '#fed7aa';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cupX + 22, cupY + 5, 8, -Math.PI/2, Math.PI/2);
  ctx.stroke();
  // Steam lines
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cupX - 8, cupY - 12); ctx.quadraticCurveTo(cupX - 4, cupY - 20, cupX - 8, cupY - 25);
  ctx.moveTo(cupX + 8, cupY - 12); ctx.quadraticCurveTo(cupX + 12, cupY - 20, cupX + 8, cupY - 25);
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#fed7aa';
  ctx.font = '800 28px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.toUpperCase() + ' BREAK', 512, 195);

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;

  ctx.strokeStyle = '#f59e0b'; // amber-500
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 20);
  ctx.stroke();

  // Star accents
  drawStar(ctx, boxX + 45, boxY + 40, 4, 12, 5, '#f59e0b');
  drawStar(ctx, boxX + boxWidth - 45, boxY + boxHeight - 40, 4, 12, 5, '#f59e0b');

  // Dynamic text color variation: Warm Cream, Peach, or Warm Gold
  const colors = ['#ffedd5', '#fed7aa', '#fef3c7'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, '#f59e0b', '#fed7aa', '#fcd9a8');
}

// Theme 9: Chalkboard (Textured dark green school board)
function drawChalkboardTheme(ctx, jokeText, category, jokeId) {
  ctx.fillStyle = '#153d26'; // chalkboard green
  ctx.fillRect(0, 0, 1024, 1024);

  // Chalk dust overlay (fine lines)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 1024, Math.random() * 1024);
    ctx.lineTo(Math.random() * 1024, Math.random() * 1024);
    ctx.stroke();
  }

  // Header Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.toUpperCase() + ' CLASS', 512, 140);

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;

  // Chalk dashed outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.setLineDash([15, 12]);
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // Chalk quotes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '800 64px "BricolageGrotesque"';
  ctx.fillText('“', boxX + 45, boxY + 65);
  ctx.fillText('”', boxX + boxWidth - 45, boxY + boxHeight - 35);

  // Dynamic text color variation: Pure chalk white, light chalk yellow, or chalk green
  const colors = ['rgba(255, 255, 255, 0.95)', '#fef08a', '#d1fae5'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.45)');
}

// Theme 10: Vaporwave Grid (80s Magenta/Purple Grid Theme)
function drawVaporwaveTheme(ctx, jokeText, category, jokeId) {
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#581c87'); // purple-900
  grad.addColorStop(0.5, '#701a75'); // fuchsia-900
  grad.addColorStop(1, '#0f172a'); // slate-900
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Perspectives Grid
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)'; // pink-500
  ctx.lineWidth = 2;
  for (let y = 800; y <= 1024; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }
  for (let x = -200; x <= 1224; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 800);
    ctx.lineTo(512 + (x - 512)*2.5, 1024);
    ctx.stroke();
  }

  // Retro Sun
  const sunX = 512;
  const sunY = 140;
  const sunRad = 70;
  const sunGrad = ctx.createLinearGradient(0, sunY - sunRad, 0, sunY + sunRad);
  sunGrad.addColorStop(0, '#f43f5e'); // rose-500
  sunGrad.addColorStop(1, '#eab308'); // yellow-500
  ctx.fillStyle = sunGrad;
  ctx.beginPath(); ctx.arc(sunX, sunY, sunRad, Math.PI, 0); ctx.fill();
  
  // Retro Sun Lines
  ctx.fillStyle = '#581c87';
  ctx.fillRect(sunX - sunRad, sunY - 12, sunRad*2, 4);
  ctx.fillRect(sunX - sunRad, sunY - 4, sunRad*2, 4);

  // Category Title
  ctx.fillStyle = '#06b6d4'; // cyan-500
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.toUpperCase(), 512, 210);

  const boxX = 120;
  const boxY = 280;
  const boxWidth = 784;
  const boxHeight = 490;

  ctx.strokeStyle = '#ec4899'; // pink-500
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 20);
  ctx.stroke();

  // Dynamic text color variation: Pure White, Glowing Neon Cyan, or Bright Neon Pink
  const colors = ['#ffffff', '#a5f3fc', '#fbcfe8'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, '#ec4899', '#a5f3fc', '#6b7280');
}

// Theme 11: Minimalist Clean (Light White Theme with Elegant Borders)
function drawMinimalTheme(ctx, jokeText, category, jokeId) {
  ctx.fillStyle = '#fafafa'; // zinc-50
  ctx.fillRect(0, 0, 1024, 1024);

  // Header Title
  ctx.fillStyle = '#18181b'; // zinc-900
  ctx.font = '800 32px "BricolageGrotesque"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.toUpperCase(), 512, 140);

  const boxX = 120;
  const boxY = 260;
  const boxWidth = 784;
  const boxHeight = 520;

  // Thin double border
  ctx.strokeStyle = '#e4e4e7'; // zinc-200
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 16);
  ctx.stroke();

  ctx.strokeStyle = '#18181b'; // zinc-900
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, boxX + 6, boxY + 6, boxWidth - 12, boxHeight - 12, 10);
  ctx.stroke();

  // Subtle quote watermark behind text
  ctx.fillStyle = 'rgba(24, 24, 27, 0.05)';
  ctx.font = '800 360px "BricolageGrotesque"';
  ctx.fillText('“', 300, 520);
  ctx.fillText('”', 724, 620);

  // Dynamic text color variation: Slate-900, Charcoal Black, or Deep Navy Blue
  const colors = ['#18181b', '#0f172a', '#1e3a8a'];
  const textColor = colors[jokeId % colors.length];

  drawWrappedJokeText(ctx, jokeText, boxY, boxHeight, textColor, 44);
  drawFooter(ctx, '#e4e4e7', '#18181b', '#a1a1aa');
}

// ==========================================
// CORE EXPORT ENGINE
// ==========================================

/**
 * Dynamically generates a beautiful 1024x1024 PNG image card for a joke.
 * Rotates between 12 distinct premium design themes based on joke ID.
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

    // Rotate theme using joke ID modulo 12
    const themeIndex = jokeId % 12;

    switch (themeIndex) {
      case 0:
        logger.info('Generating card using Theme 0: Dark Board...');
        drawDarkBoardTheme(ctx, text, category, jokeId);
        break;
      case 1:
        logger.info('Generating card using Theme 1: Comic Orange...');
        drawComicOrangeTheme(ctx, text, category, jokeId);
        break;
      case 2:
        logger.info('Generating card using Theme 2: Cute Pastel...');
        drawPastelCuteTheme(ctx, text, category, jokeId);
        break;
      case 3:
        logger.info('Generating card using Theme 3: Cozy Night Sky...');
        drawNightSkyTheme(ctx, text, category, jokeId);
        break;
      case 4:
        logger.info('Generating card using Theme 4: Sunset Silhouette...');
        drawSunsetTheme(ctx, text, category, jokeId);
        break;
      case 5:
        logger.info('Generating card using Theme 5: Cyberpunk Neon...');
        drawCyberpunkTheme(ctx, text, category, jokeId);
        break;
      case 6:
        logger.info('Generating card using Theme 6: Matrix Hacker...');
        drawMatrixTheme(ctx, text, category, jokeId);
        break;
      case 7:
        logger.info('Generating card using Theme 7: Forest Nature...');
        drawForestTheme(ctx, text, category, jokeId);
        break;
      case 8:
        logger.info('Generating card using Theme 8: Cozy Coffee...');
        drawCoffeeTheme(ctx, text, category, jokeId);
        break;
      case 9:
        logger.info('Generating card using Theme 9: Chalkboard Class...');
        drawChalkboardTheme(ctx, text, category, jokeId);
        break;
      case 10:
        logger.info('Generating card using Theme 10: Vaporwave Grid...');
        drawVaporwaveTheme(ctx, text, category, jokeId);
        break;
      case 11:
      default:
        logger.info('Generating card using Theme 11: Minimalist Clean...');
        drawMinimalTheme(ctx, text, category, jokeId);
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

