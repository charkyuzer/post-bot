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

const CATEGORY_BG = {
  // Office & Corporate
  office: "office.png",
  corporate: "office.png",
  boss: "office.png",
  manager: "office.png",
  hr: "office.png",
  salary: "office.png",
  meetings: "office.png",
  "work from home": "office.png",
  client: "office.png",
  freelancer: "office.png",
  intern: "office.png",
  startup: "office.png",
  "customer service": "office.png",

  // Programming & Tech
  programming: "programming.png",
  ai: "programming.png",
  chatgpt: "programming.png",
  passwords: "programming.png",
  wifi: "programming.png",
  "tech support": "programming.png",

  // College & Student
  college: "college.png",
  student: "college.png",
  engineering: "college.png",
  engineers: "college.png",
  exam: "college.png",
  hostel: "college.png",
  teacher: "college.png",
  roommate: "college.png",

  // Family & Parents
  "indian parents": "indian_family.png",
  "indian family": "indian_family.png",
  family: "indian_family.png",
  mom: "indian_family.png",
  dad: "indian_family.png",

  // Relationships & Dating
  relationships: "relationships.png",
  relationship: "relationships.png",
  dating: "relationships.png",
  marriage: "relationships.png",
  crush: "relationships.png",
  friends: "relationships.png",
  "best friend": "relationships.png",

  // Social Media & Internet
  "social media": "social_media.png",
  internet: "social_media.png",
  instagram: "social_media.png",
  whatsapp: "social_media.png",
  youtube: "social_media.png",
  facebook: "social_media.png",
  influencer: "social_media.png",
  movies: "social_media.png",
  "mobile battery": "social_media.png",

  // Money & Shopping
  money: "money.png",
  shopping: "money.png",
  "online shopping": "money.png",
  amazon: "money.png",
  flipkart: "money.png",
  upi: "money.png",
  bank: "money.png",

  // Food & Drinks
  food: "food.png",
  biryani: "food.png",
  pizza: "food.png",
  coffee: "food.png",
  tea: "food.png",
  diet: "food.png",

  // Gaming
  gaming: "gaming.png",
  bgmi: "gaming.png",
  pubg: "gaming.png",
  gta: "gaming.png",
  valorant: "gaming.png",

  // Daily Life & Fitness
  "daily life": "daily_life.png",
  weekend: "daily_life.png",
  monday: "daily_life.png",
  sleep: "daily_life.png",
  "lazy people": "daily_life.png",
  overthinking: "daily_life.png",
  adulting: "daily_life.png",
  traffic: "daily_life.png",
  auto: "daily_life.png",
  cab: "daily_life.png",
  train: "daily_life.png",
  travel: "daily_life.png",
  gym: "daily_life.png",
  fitness: "daily_life.png",
  cricket: "daily_life.png",
  doctors: "daily_life.png",
  police: "daily_life.png",
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

// ── Sentence / Paragraph Splitting ───────────────────────────
function splitParagraphs(text) {
  const rawParagraphs = text.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);
  const finalParagraphs = [];
  const abbrevs = /^(mr|mrs|dr|vs|prof|sr|jr|e\.g|i\.e|a\.m|p\.m|rs|no)$/i;

  for (const para of rawParagraphs) {
    const parts = para.split(/(?<=[.!?])\s+/);
    let currentSentence = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      if (!currentSentence) {
        currentSentence = part;
      } else {
        const lastWord = currentSentence.split(/\s+/).pop().replace(/[^a-zA-Z]/g, "").toLowerCase();
        if (abbrevs.test(lastWord)) {
          currentSentence += " " + part;
        } else {
          finalParagraphs.push(currentSentence);
          currentSentence = part;
        }
      }
    }
    if (currentSentence) {
      finalParagraphs.push(currentSentence);
    }
  }
  return finalParagraphs.length > 0 ? finalParagraphs : [text];
}

// ── Punchline detection ───────────────────────────────────────
// Words that carry comedic/emotional weight in jokes
const IMPACT_WORDS = new Set([
  // Money & Work
  "salary", "paisa", "rupees", "bank", "account", "balance", "zero", "crore", "lakh", "budget", "rent", "debt", "loan", "emi", "tax", "cash", "freelancer", "upi",
  "boss", "manager", "hr", "office", "job", "fired", "resign", "resigned", "layoff", "appraisal", "promotion", "meeting", "deadline", "work", "wfh", "intern", "client", "startup",
  // Tech & Code
  "code", "coding", "programmer", "developer", "bug", "error", "crashed", "ai", "chatgpt", "wifi", "data", "password", "reboot", "update", "server", "database", "backup", "repo",
  // Relationships & Dating
  "crush", "ex", "breakup", "single", "relationship", "dating", "shaadi", "marriage", "divorce", "wife", "husband", "gf", "bf", "proposal", "love", "romantic",
  // Education & College
  "exam", "fail", "failed", "pass", "topper", "backlog", "degree", "cgpa", "marks", "result", "college", "hostel", "canteen", "bunk", "professor",
  // Food & Lifestyle
  "biryani", "pizza", "coffee", "chai", "tea", "momo", "swiggy", "zomato", "diet", "gym", "eating", "food", "drink", "daaru", "beer",
  // Emotions & Strong Verbs/Reactions
  "crying", "cried", "laughing", "screaming", "dying", "dead", "shocked", "confused", "embarrassed", "terrified", "furious", "panic", "anxiety", "depressed", "obsessed", "exhausted", "stressed", "blocked", "unfollow", "deleted", "scam", "fake", "troll", "screwed", "cheated", "ghosted",
  // Social Media
  "instagram", "whatsapp", "youtube", "facebook", "twitter", "viral", "meme", "reels", "followers", "likes", "notifications",
  // Daily Life
  "monday", "weekend", "sleep", "sleeping", "overthinking", "traffic", "auto", "cab", "flight", "train", "chalan", "fine", "hospital", "police"
]);

const STOP = new Set([
  // English stop words & fillers
  "the", "and", "is", "in", "of", "to", "a", "an", "it", "on", "at", "be", "as", "by", "or", "not", "so", "if", "me", "my", "we", "he", "she", "they", "you", "i", "your", "our", "their", "its", "was", "are", "were", "has", "had", "have", "do", "did", "does", "for", "with", "that", "this", "from", "will", "can", "may", "just", "also", "then", "than", "when", "what", "how", "who", "which", "all", "said", "says", "told", "ask", "asked", "think", "thinks", "thought", "know", "knows", "knew", "like", "likes", "liked", "get", "gets", "got", "make", "makes", "made", "give", "gives", "gave", "take", "takes", "took", "see", "saw", "seen", "look", "looked", "come", "came", "go", "went", "gone", "day", "today", "time", "people", "someone", "anyone", "something", "anything", "thing", "things", "always", "never", "ever", "very", "much", "more", "most", "some", "many", "any", "even", "still", "already", "here", "there",
  // Hinglish stop words & fillers
  "hai", "tha", "thi", "the", "bhi", "par", "pe", "aur", "toh", "to", "ya", "se", "ko", "ke", "ka", "ki", "ne", "me", "mein", "re", "ab", "sab", "kya", "kyun", "kaise", "kahan", "kaun", "konsa", "kuch", "har", "ek", "do", "tin", "yeh", "ye", "woh", "wo", "is", "us", "jin", "un", "mera", "meri", "mere", "tera", "teri", "tere", "apna", "apni", "apne", "unka", "unki", "unke", "iske", "uske", "jiske", "waha", "yaha", "kabhi", "baad", "pehle", "lagta", "hoga", "hogi", "hoge", "sath", "baat", "bolo", "batao", "suno", "samjhe", "karo", "kare", "karna", "bohot", "bahut", "bilkul", "zyada", "kam", "saara", "saare", "waala", "waali", "wale", "bhai", "sir", "yaar"
]);

function findHighlights(text) {
  const clauses = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const punchline = clauses.length > 1 ? clauses[clauses.length - 1] : text;
  const punchWords = new Set(
    punchline.split(/\s+/).map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, ""))
  );

  const rawTokens = text.split(/\s+/);
  const scored = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const raw = rawTokens[i];
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/gi, "");

    // Skip empty, short (< 3 chars unless number), or stop words
    if (!clean || STOP.has(clean)) continue;
    if (clean.length < 3 && !/^\d+$/.test(clean)) continue;

    let score = 0;

    // 1. Explicit author formatting (*word*, "word", 'word', or ALL CAPS like WTF / FREE)
    if (/^[*'"].*[*'"]$/.test(raw) || (raw === raw.toUpperCase() && raw.length >= 3 && /[A-Z]/.test(raw))) {
      score += 20;
    }

    // 2. Numbers / monetary amounts / percentages (e.g. 500, 10k, 100%, ₹200)
    if (/^\d+[kK%]?$/.test(clean) || /^[$₹]\d+/.test(raw)) {
      score += 15;
    }

    // 3. Punchline clause location (words at the end of the joke carry emotional payload)
    if (punchWords.has(clean)) {
      score += 8;
    }

    // 4. Substantive word length & uniqueness (longer words carry higher semantic density)
    score += Math.min(clean.length * 1.2, 10);

    // 5. Mid-sentence capitalization boost (proper nouns / key terms)
    if (i > 0 && /^[A-Z][a-z]/.test(raw)) {
      score += 6;
    }

    // 6. Impact dictionary bonus (if matches known impact set)
    if (IMPACT_WORDS.has(clean)) {
      score += 8;
    }

    scored.push({ clean, score });
  }

  // Sort candidate words by score descending
  scored.sort((a, b) => b.score - a.score);

  const picks = [];
  const seen = new Set();

  for (const { clean } of scored) {
    if (!seen.has(clean)) {
      seen.add(clean);
      picks.push(clean);
      if (picks.length === 2) break;
    }
  }

  return picks;
}

// ── Draw one line — mixed size/weight/color ───────────────────
function drawLine(ctx, line, cx, baseY, baseFs, hlSet) {
  const hlFs = Math.round(baseFs * 0.95);
  const PAD_X = 10;
  const PAD_Y = 5;
  const RADIUS = 8;
  const tokens = line.trim().split(/(\s+)/);

  function parseToken(tok) {
    if (!tok || !tok.trim()) {
      return { isSpace: true, raw: tok };
    }
    const match = tok.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9]+(?:[''-][a-zA-Z0-9]+)*)?([^a-zA-Z0-9]*)$/);
    if (!match || !match[2]) {
      return { isSpace: false, raw: tok, prefix: tok, core: "", suffix: "", isHL: false };
    }
    const prefix = match[1] || "";
    const core = match[2];
    const suffix = match[3] || "";
    const isHL = hlSet.has(core.toLowerCase());
    return { isSpace: false, raw: tok, prefix, core, suffix, isHL };
  }

  const parsed = tokens.map(parseToken);

  // Measure widths
  let totalW = 0;
  const parts = parsed.map((item) => {
    if (item.isSpace) {
      ctx.font = `700 ${baseFs}px "${FONT}"`;
      const w = ctx.measureText(item.raw).width;
      totalW += w;
      return { ...item, w };
    }
    if (item.isHL && item.core) {
      ctx.font = `700 ${baseFs}px "${FONT}"`;
      const preW = item.prefix ? ctx.measureText(item.prefix).width : 0;
      const sufW = item.suffix ? ctx.measureText(item.suffix).width : 0;

      ctx.font = `800 ${hlFs}px "${FONT_SORA}"`;
      const coreW = ctx.measureText(item.core).width;
      const pillW = coreW + PAD_X * 2;

      const totalTokW = preW + pillW + sufW;
      totalW += totalTokW;
      return { ...item, preW, coreW, pillW, sufW, w: totalTokW };
    } else {
      ctx.font = `700 ${baseFs}px "${FONT}"`;
      const w = ctx.measureText(item.raw).width;
      totalW += w;
      return { ...item, w };
    }
  });

  let x = cx - totalW / 2;
  ctx.save();
  ctx.textBaseline = "alphabetic";

  for (const item of parts) {
    if (item.isSpace) {
      ctx.font = `700 ${baseFs}px "${FONT}"`;
      ctx.fillStyle = WHITE;
      ctx.fillText(item.raw, x, baseY);
      x += item.w;
    } else if (item.isHL && item.core) {
      if (item.prefix) {
        ctx.font = `700 ${baseFs}px "${FONT}"`;
        ctx.fillStyle = WHITE;
        ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.fillText(item.prefix, x, baseY);
        ctx.shadowColor = "transparent";
        x += item.preW;
      }

      const pillH = hlFs + PAD_Y * 2;
      const pillX = x;
      const pillY = baseY - hlFs * 0.82 - PAD_Y;

      // Draw Pill background with soft drop shadow & warm gold-amber gradient
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 5;

      const grad = ctx.createLinearGradient(pillX, pillY, pillX + item.pillW, pillY + pillH);
      grad.addColorStop(0, "#FFD700"); // Electric Gold
      grad.addColorStop(1, "#FF9100"); // Rich Warm Amber

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(pillX + RADIUS, pillY);
      ctx.lineTo(pillX + item.pillW - RADIUS, pillY);
      ctx.quadraticCurveTo(pillX + item.pillW, pillY, pillX + item.pillW, pillY + RADIUS);
      ctx.lineTo(pillX + item.pillW, pillY + pillH - RADIUS);
      ctx.quadraticCurveTo(
        pillX + item.pillW,
        pillY + pillH,
        pillX + item.pillW - RADIUS,
        pillY + pillH
      );
      ctx.lineTo(pillX + RADIUS, pillY + pillH);
      ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - RADIUS);
      ctx.lineTo(pillX, pillY + RADIUS);
      ctx.quadraticCurveTo(pillX, pillY, pillX + RADIUS, pillY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw core text on pill (Dark contrast, Sora bold)
      ctx.save();
      ctx.font = `800 ${hlFs}px "${FONT_SORA}"`;
      ctx.fillStyle = "#111111";
      ctx.fillText(item.core, x + PAD_X, baseY);
      ctx.restore();

      x += item.pillW;

      if (item.suffix) {
        ctx.font = `700 ${baseFs}px "${FONT}"`;
        ctx.fillStyle = WHITE;
        ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.fillText(item.suffix, x, baseY);
        ctx.shadowColor = "transparent";
        x += item.sufW;
      }
    } else {
      ctx.font = `700 ${baseFs}px "${FONT}"`;
      ctx.fillStyle = WHITE;
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.fillText(item.raw, x, baseY);
      ctx.shadowColor = "transparent";
      x += item.w;
    }
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
  const paraGap = Math.round(fs * 0.40); // Vertical gap between sentences/paragraphs

  const paragraphs = splitParagraphs(text);
  let totalLineCount = 0;
  const wrappedParagraphs = paragraphs.map((p) => {
    const lines = wrap(ctx, p, maxW, fs);
    totalLineCount += lines.length;
    return lines;
  });

  const totalH =
    totalLineCount * lh + Math.max(0, paragraphs.length - 1) * paraGap;

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
  const blockTop = H * 0.42 - totalH / 2;

  let currentY = blockTop + fs * 0.82; // cap-height offset

  wrappedParagraphs.forEach((pLines, pIdx) => {
    pLines.forEach((line) => {
      drawLine(ctx, line, W / 2, currentY, fs, hlSet);
      currentY += lh;
    });
    if (pIdx < wrappedParagraphs.length - 1) {
      currentY += paraGap;
    }
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