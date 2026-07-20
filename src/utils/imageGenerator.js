const {
  createCanvas,
  loadImage,
  GlobalFonts,
  Path2D,
} = require("@napi-rs/canvas");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const logger = require("./logger");

// ── Fonts ─────────────────────────────────────────────────────
const ASSETS = path.join(__dirname, "../assets");
const FONT = "Satoshi";
const FONT_SORA = "Sora";
try {
  GlobalFonts.registerFromPath(path.join(ASSETS, "Satoshi-Bold.ttf"), FONT);
  GlobalFonts.registerFromPath(path.join(ASSETS, "Satoshi-Medium.ttf"), FONT);
  GlobalFonts.registerFromPath(path.join(ASSETS, "Satoshi-Regular.ttf"), FONT);
  GlobalFonts.registerFromPath(
    path.join(ASSETS, "Sora-Variable.ttf"),
    FONT_SORA,
  );
} catch (e) {
  logger.error("Font load: %s", e.message);
}

// ── Constants ─────────────────────────────────────────────────
const BG_DIR = path.join(__dirname, "../assets/backgrounds");
const W = 1080;
const H = 1350;
const SCALE = 1;
const AMBER = "#FFB347";
const WHITE = "#FFFFFF";
const HL_BG = "#F4C430";
const HL_COLOR = "#1A1A1A";

// ── Category → background ────────────────────────────────────
const CATEGORY_BG = {
  "daily life": "daily_life.png",
  "indian parents": "indian_family.png",
  "indian family": "indian_family.png",
  family: "indian_family.png",
  office: "office.png",
  corporate: "office.png",
  programming: "programming.png",
  college: "college.png",
  student: "college.png",
  relationships: "relationships.png",
  relationship: "relationships.png",
  "social media": "social_media.png",
  internet: "social_media.png",
  money: "money.png",
  shopping: "money.png",
  food: "food.png",
  gaming: "gaming.png",
};
const FALLBACKS = Array.from({ length: 15 }, (_, i) => `bg${i}.png`);

function getBgPath(cat, id) {
  const f = CATEGORY_BG[cat];
  if (f) {
    const p = path.join(BG_DIR, f);
    if (fs.existsSync(p)) return p;
  }
  return path.join(BG_DIR, FALLBACKS[id % FALLBACKS.length]);
}

// ── Background processing ─────────────────────────────────────
async function prepareBg(bgPath) {
  return sharp(bgPath)
    .resize(W * SCALE, H * SCALE, { fit: "cover", position: "centre" })
    .blur(8)
    .modulate({ brightness: 0.88, saturation: 0.9 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

// ── Font size based on text length ───────────────────────────
function getFontSize(len) {
  if (len > 200) return 50;
  if (len > 150) return 58;
  if (len > 100) return 66;
  if (len > 60) return 74;
  return 80;
}

// ── Word wrap ─────────────────────────────────────────────────
function wrap(ctx, text, maxW, fs) {
  ctx.font = `700 ${fs}px "${FONT}"`;
  const words = text.split(/\s+/);
  const lines = [];
  let cur = words[0] || "";
  for (let i = 1; i < words.length; i++) {
    const t = cur + " " + words[i];
    if (ctx.measureText(t).width <= maxW) cur = t;
    else {
      lines.push(cur);
      cur = words[i];
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Punchline detection ───────────────────────────────────────
// Words that carry comedic/emotional weight in jokes
const IMPACT_WORDS = new Set([
  // emotions & reactions
  "crying",
  "laughing",
  "screaming",
  "dying",
  "dead",
  "shocked",
  "confused",
  "embarrassed",
  "terrified",
  "furious",
  "desperate",
  "panic",
  "anxiety",
  "depressed",
  "excited",
  "obsessed",
  "addicted",
  "exhausted",
  "stressed",
  // strong verbs
  "quit",
  "fired",
  "broke",
  "failed",
  "forgot",
  "lied",
  "cheated",
  "ghosted",
  "blocked",
  "deleted",
  "crashed",
  "exploded",
  "destroyed",
  "survived",
  "regret",
  "blame",
  "admit",
  "pretend",
  "ignore",
  "avoid",
  "escape",
  // punchline nouns
  "wifi",
  "money",
  "sleep",
  "coffee",
  "deadline",
  "meeting",
  "boss",
  "salary",
  "diet",
  "gym",
  "exam",
  "grade",
  "debt",
  "rent",
  "budget",
  "interview",
  "password",
  "update",
  "error",
  "bug",
  "feature",
  "reboot",
  "backup",
  "ex",
  "crush",
  "date",
  "wedding",
  "divorce",
  "baby",
  "mom",
  "dad",
  "doctor",
  "dentist",
  "therapist",
  "lawyer",
  "accountant",
  // intensifiers that land
  "never",
  "always",
  "literally",
  "actually",
  "basically",
  "technically",
  "officially",
  "immediately",
  "suddenly",
  "finally",
  "already",
  "still",
  "worst",
  "best",
  "only",
  "free",
  "fake",
  "real",
  "wrong",
  "right",
  // comedy contrast words
  "but",
  "except",
  "unless",
  "until",
  "meanwhile",
  "suddenly",
  "plot",
  "twist",
  "surprise",
  "secret",
  "truth",
  "lie",
  "reality",
  "dream",
]);

const STOP = new Set([
  "the",
  "and",
  "is",
  "in",
  "of",
  "to",
  "a",
  "an",
  "it",
  "on",
  "at",
  "be",
  "as",
  "by",
  "or",
  "not",
  "so",
  "if",
  "me",
  "my",
  "we",
  "he",
  "she",
  "they",
  "you",
  "i",
  "was",
  "are",
  "were",
  "has",
  "had",
  "have",
  "do",
  "did",
  "does",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "our",
  "their",
  "its",
  "will",
  "can",
  "may",
  "just",
  "also",
  "then",
  "than",
  "when",
  "what",
  "how",
  "who",
  "which",
  "all",
]);

function getPunchline(text) {
  const clauses = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return clauses.length > 1 ? clauses[clauses.length - 1] : text;
}

function findHighlights(text) {
  const punchline = getPunchline(text);
  const punchWords = new Set(
    punchline.split(/\s+/).map((w) => w.toLowerCase().replace(/[^a-z]/gi, "")),
  );

  const scored = text.split(/\s+/).map((raw) => {
    const clean = raw.toLowerCase().replace(/[^a-z]/gi, "");
    if (clean.length < 3 || STOP.has(clean)) return { raw, score: -1 };

    let score = 0;
    if (IMPACT_WORDS.has(clean)) score += 10; // semantic weight
    if (punchWords.has(clean)) score += 6; // in punchline clause
    if (score === 0) score = -1; // skip generic words
    return { raw, score };
  });

  const seen = new Set();
  const picks = [];
  for (const { raw, score } of [...scored].sort((a, b) => b.score - a.score)) {
    if (score < 0) break;
    const clean = raw.toLowerCase().replace(/[^a-z]/gi, "");
    if (!seen.has(clean)) {
      seen.add(clean);
      picks.push(raw);
      if (picks.length === 2) break;
    }
  }
  return picks;
}

// ── Draw one line — mixed size/weight/color ───────────────────
function drawLine(ctx, line, cx, baseY, baseFs, hlSet) {
  const hlFs = Math.round(baseFs * 0.95);
  const PAD_X = 6;
  const PAD_Y = 3;
  const RADIUS = 5;
  const tokens = line.trim().split(/(\s+)/);

  // Measure all tokens
  let totalW = 0;
  const parts = tokens.map((tok) => {
    const clean = tok
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/gi, "");
    const hl = clean.length > 0 && hlSet.has(clean);
    const fs = hl ? hlFs : baseFs;
    ctx.font = hl ? `800 ${fs}px "${FONT_SORA}"` : `700 ${fs}px "${FONT}"`;
    const w = ctx.measureText(tok).width;
    totalW += w;
    return { tok, hl, fs, w };
  });

  let x = cx - totalW / 2;
  ctx.save();
  ctx.textBaseline = "alphabetic";

  for (const { tok, hl, fs, w } of parts) {
    if (hl && tok.trim().length > 0) {
      // Pill background
      const pillW = w + PAD_X * 2;
      const pillH = fs + PAD_Y * 2;
      const pillX = x - PAD_X;
      const pillY = baseY - fs * 0.82 - PAD_Y;

      ctx.save();
      ctx.fillStyle = HL_BG;
      ctx.beginPath();
      ctx.moveTo(pillX + RADIUS, pillY);
      ctx.lineTo(pillX + pillW - RADIUS, pillY);
      ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + RADIUS);
      ctx.lineTo(pillX + pillW, pillY + pillH - RADIUS);
      ctx.quadraticCurveTo(
        pillX + pillW,
        pillY + pillH,
        pillX + pillW - RADIUS,
        pillY + pillH,
      );
      ctx.lineTo(pillX + RADIUS, pillY + pillH);
      ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - RADIUS);
      ctx.lineTo(pillX, pillY + RADIUS);
      ctx.quadraticCurveTo(pillX, pillY, pillX + RADIUS, pillY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Text on pill — amber Sora bold
      ctx.save();
      ctx.font = `800 ${hlFs}px "${FONT_SORA}"`;
      ctx.fillStyle = HL_COLOR;
      ctx.fillText(tok, x, baseY);
      ctx.restore();
    } else {
      ctx.font = `700 ${fs}px "${FONT}"`;
      ctx.fillStyle = WHITE;
      ctx.fillText(tok, x, baseY);
    }
    x += w;
  }
  ctx.restore();
}

// ── Lucide icon ───────────────────────────────────────────────
function drawIcon(ctx, d, cx, cy, size) {
  ctx.save();
  const s = size / 24;
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(s, s);
  const p = new Path2D(d);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2 / s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(p);
  ctx.restore();
}

// ── Main ──────────────────────────────────────────────────────
async function generateJokeCard(jokeObj) {
  const canvas = createCanvas(W * SCALE, H * SCALE);
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  const id = jokeObj.id || 1;
  const cat = (jokeObj.category || "random").toLowerCase().trim();
  const text = jokeObj.joke
    .replace(/[\u2014\u2013\u2012\u2015\uFE58\uFE63\uFF0D]/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
  const catLabel = cat.toUpperCase();

  // ── 1. Background ─────────────────────────────────────────
  try {
    const buf = await prepareBg(getBgPath(cat, id));
    ctx.drawImage(await loadImage(buf), 0, 0, W, H);
  } catch (e) {
    logger.error("BG: %s", e.message);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. Overlays ───────────────────────────────────────────
  // Flat dark overlay 28%
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, 0, W, H);

  // Vignette — corners only, subtle
  const vig = ctx.createRadialGradient(
    W / 2,
    H / 2,
    H * 0.32,
    W / 2,
    H / 2,
    H * 0.82,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Top gradient — title area
  const tg = ctx.createLinearGradient(0, 0, 0, 160);
  tg.addColorStop(0, "rgba(0,0,0,0.60)");
  tg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = tg;
  ctx.fillRect(0, 0, W, 160);

  // Bottom gradient — footer area
  const bg2 = ctx.createLinearGradient(0, H - 200, 0, H);
  bg2.addColorStop(0, "rgba(0,0,0,0)");
  bg2.addColorStop(1, "rgba(0,0,0,0.70)");
  ctx.fillStyle = bg2;
  ctx.fillRect(0, H - 200, W, 200);

  // ── 3. Title ──────────────────────────────────────────────
  const TY = 90;
  const TFS = 26;

  ctx.save();
  ctx.font = `600 ${TFS}px "${FONT}"`;
  ctx.fillStyle = "rgba(245,241,234,0.90)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "8px";
  const lw = ctx.measureText(catLabel).width;
  ctx.fillText(catLabel, W / 2, TY);
  ctx.letterSpacing = "0px";
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - lw / 2 - 28 - 200, TY);
  ctx.lineTo(W / 2 - lw / 2 - 28, TY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + lw / 2 + 28, TY);
  ctx.lineTo(W / 2 + lw / 2 + 28 + 200, TY);
  ctx.stroke();
  ctx.restore();

  // ── 4. Joke text ──────────────────────────────────────────
  const fs = getFontSize(text.length);
  const maxW = W * 0.65;
  const lh = fs * 1.25;
  const lines = wrap(ctx, text, maxW, fs);
  const totalH = lines.length * lh;
  const hlPhrases =
    jokeObj.highlights && jokeObj.highlights.length
      ? jokeObj.highlights.map((h) => h.toLowerCase())
      : findHighlights(text).map((h) => h.toLowerCase());

  // Build a set of individual words that belong to any highlight phrase
  const hlSet = new Set();
  for (const phrase of hlPhrases) {
    for (const w of phrase.split(/\s+/))
      hlSet.add(w.replace(/[^a-z]/gi, "").toLowerCase());
  }

  // Position: visual center slightly above middle (~42% from top)
  // baseY = top of first line's alphabetic baseline
  const blockTop = H * 0.42 - totalH / 2;
  const baseY = blockTop + fs * 0.82; // cap-height offset

  lines.forEach((line, i) => {
    drawLine(ctx, line, W / 2, baseY + i * lh, fs, hlSet);
  });

  // ── 5. Footer ─────────────────────────────────────────────
  const BOT = H - 50;
  const DIV_Y = BOT - 90;
  const HDL_Y = BOT - 56;
  const ICO_Y = BOT - 18;

  // Divider — isolated save/restore
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 160, DIV_Y);
  ctx.lineTo(W / 2 + 160, DIV_Y);
  ctx.stroke();
  ctx.restore();

  // @handle
  ctx.save();
  ctx.font = `400 22px "${FONT}"`;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("@jokerryan.bsky.social", W / 2, HDL_Y);
  ctx.restore();

  // Like | Share | Follow — each drawn fully isolated
  const HEART =
    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";
  const SHARE =
    "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13";
  const FOLLOW = "M12 5v14M5 12h14";

  const ISZ = 20,
    LG = 9,
    GG = 44;

  // Measure label widths
  ctx.save();
  ctx.font = `400 18px "${FONT}"`;
  const lkW = ctx.measureText("Like").width;
  const shW = ctx.measureText("Share").width;
  const flW = ctx.measureText("Follow").width;
  ctx.restore();

  const totalFW =
    ISZ +
    LG +
    lkW +
    GG +
    1 +
    GG +
    (ISZ + LG + shW) +
    GG +
    1 +
    GG +
    (ISZ + LG + flW);
  let fx = W / 2 - totalFW / 2;

  // Draw icon — fully isolated
  const paintIcon = (d, cx, cy) => {
    ctx.save();
    const s = ISZ / 24;
    ctx.translate(cx - ISZ / 2, cy - ISZ / 2);
    ctx.scale(s, s);
    ctx.strokeStyle = "rgba(255,255,255,0.80)";
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.lineWidth = 2 / s;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(new Path2D(d));
    ctx.restore();
  };

  // Draw label — fully isolated
  const paintLabel = (label, x, y) => {
    ctx.save();
    ctx.font = `400 18px "${FONT}"`;
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y);
    ctx.restore();
  };

  // Draw separator — fully isolated
  const paintSep = (x) => {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, ICO_Y - 11);
    ctx.lineTo(x, ICO_Y + 11);
    ctx.stroke();
    ctx.restore();
  };

  // Like
  paintIcon(HEART, fx + ISZ / 2, ICO_Y);
  paintLabel("Like", fx + ISZ + LG, ICO_Y);
  fx += ISZ + LG + lkW + GG;
  paintSep(fx);
  fx += 1 + GG;

  // Share
  paintIcon(SHARE, fx + ISZ / 2, ICO_Y);
  paintLabel("Share", fx + ISZ + LG, ICO_Y);
  fx += ISZ + LG + shW + GG;
  paintSep(fx);
  fx += 1 + GG;

  // Follow
  paintIcon(FOLLOW, fx + ISZ / 2, ICO_Y);
  paintLabel("Follow", fx + ISZ + LG, ICO_Y);

  const pngBuffer = canvas.toBuffer("image/png");

  return await sharp(pngBuffer)
    .jpeg({
      quality: 82,
      mozjpeg: true,
    })
    .toBuffer();
}

module.exports = { generateJokeCard };
