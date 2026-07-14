const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const logger = require('./utils/logger');
const db = require('./config/db');
const bluesky = require('./config/bluesky');
const jokeService = require('./services/jokeService');
const schedulerService = require('./services/schedulerService');
const { runJokePostingJob, getJobStatus } = require('./jobs/hourlyJob');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve main dashboard (HTML page with premium design)
app.get('/', async (req, res) => {
  try {
    const stats = await jokeService.getStats();
    const recentLogs = await jokeService.getLogs(10);
    const upcomingJokes = await jokeService.getJokes(5, 0);
    const schedulerStatus = schedulerService.getStatus();
    const jobStatus = getJobStatus();
    
    // Determine if we're in mock mode based on Bluesky credentials
    const isMock = bluesky.isInMockMode();

    // Simple, extremely modern single-page dashboard HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AutoJokeX - Bluesky Joke Bot Control Center</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-color: #0b0f19;
            --panel-bg: rgba(17, 24, 39, 0.7);
            --border-color: rgba(255, 255, 255, 0.08);
            --accent-primary: #3b82f6;
            --accent-success: #10b981;
            --accent-warning: #f59e0b;
            --accent-error: #ef4444;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Outfit', sans-serif;
            background: radial-gradient(circle at top right, #1e1b4b, var(--bg-color));
            color: var(--text-main);
            min-height: 100vh;
            padding: 2rem;
            display: flex;
            justify-content: center;
          }
          .container {
            width: 100%;
            max-width: 1200px;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1rem;
          }
          h1 {
            font-size: 2.25rem;
            font-weight: 700;
            background: linear-gradient(135deg, #60a5fa, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .mode-badge {
            background-color: ${isMock ? 'var(--accent-warning)' : 'var(--accent-success)'};
            color: #000;
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1rem;
          }
          .card {
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            backdrop-filter: blur(12px);
            padding: 1.5rem;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            transition: transform 0.2s ease, border-color 0.2s ease;
          }
          .card:hover {
            transform: translateY(-2px);
            border-color: rgba(59, 130, 246, 0.4);
          }
          .card-title {
            font-size: 0.875rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .card-value {
            font-size: 2rem;
            font-weight: 700;
          }
          .flex-layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 1.5rem;
          }
          @media (max-width: 900px) {
            .flex-layout {
              grid-template-columns: 1fr;
            }
          }
          .panel {
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            backdrop-filter: blur(12px);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .panel-title {
            font-size: 1.25rem;
            font-weight: 600;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .btn {
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            color: white;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            transition: opacity 0.2s ease, transform 0.1s ease;
          }
          .btn:hover {
            opacity: 0.9;
          }
          .btn:active {
            transform: scale(0.98);
          }
          .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-main);
            border: 1px solid var(--border-color);
          }
          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
          }
          th, td {
            text-align: left;
            padding: 0.75rem;
            border-bottom: 1px solid var(--border-color);
          }
          th {
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--accent-muted);
          }
          .dot-active {
            background-color: var(--accent-success);
            box-shadow: 0 0 8px var(--accent-success);
          }
          .badge {
            font-size: 0.75rem;
            padding: 0.15rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
          }
          .badge-success { background: rgba(16, 185, 129, 0.2); color: var(--accent-success); }
          .badge-error { background: rgba(239, 68, 68, 0.2); color: var(--accent-error); }
          .badge-pending { background: rgba(59, 130, 246, 0.2); color: var(--accent-primary); }
          .badge-locked { background: rgba(245, 158, 11, 0.2); color: var(--accent-warning); }
          
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          }
          label {
            font-size: 0.85rem;
            color: var(--text-muted);
          }
          input, select, textarea {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 0.6rem;
            border-radius: 8px;
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s ease;
          }
          input:focus, select:focus, textarea:focus {
            border-color: var(--accent-primary);
          }
          .form-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1f2937;
            border: 1px solid var(--border-color);
            padding: 1rem;
            border-radius: 8px;
            display: none;
            z-index: 100;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div>
              <h1>🤖 AutoJokeX</h1>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">Autonomous Bluesky Joke Posting Control Center</p>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span class="mode-badge">${isMock ? 'Mock API Mode' : 'Live Bluesky API'}</span>
              <div class="status-indicator">
                <div class="dot ${schedulerStatus.isRunning ? 'dot-active' : ''}"></div>
                <span>${schedulerStatus.isRunning ? 'Scheduler Active' : 'Scheduler Paused'}</span>
              </div>
            </div>
          </header>

          <div class="grid">
            <div class="card">
              <span class="card-title">Total Jokes</span>
              <span class="card-value">${stats.total}</span>
            </div>
            <div class="card" style="border-left: 4px solid var(--accent-primary);">
              <span class="card-title">Pending Jokes</span>
              <span class="card-value" style="color: #60a5fa;">${stats.pending}</span>
            </div>
            <div class="card" style="border-left: 4px solid var(--accent-success);">
              <span class="card-title">Posted Jokes</span>
              <span class="card-value" style="color: var(--accent-success);">${stats.posted}</span>
            </div>
            <div class="card" style="border-left: 4px solid var(--accent-warning);">
              <span class="card-title">Locked Jokes</span>
              <span class="card-value" style="color: var(--accent-warning);">${stats.locked}</span>
            </div>
          </div>

          <div class="flex-layout">
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              <div class="panel">
                <div class="panel-title">
                  <span>Recent Post Attempts</span>
                  <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="triggerJob()" id="triggerBtn">
                      ${jobStatus.isJobRunning ? 'Running...' : '⚡ Trigger Post Now'}
                    </button>
                  </div>
                </div>
                <div style="overflow-x: auto;">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Tweet ID</th>
                        <th>Joke Content</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${recentLogs.map(log => {
                        // SQLite CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" (UTC).
                        // Convert to ISO-8601 "YYYY-MM-DDTHH:MM:SSZ" so JS parses it as UTC.
                        const isoTimestamp = log.created_at.replace(' ', 'T') + 'Z';
                        const dateObj = new Date(isoTimestamp);
                        return `
                          <tr>
                            <td style="white-space: nowrap;">${dateObj.toLocaleTimeString()}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${dateObj.toLocaleDateString()}</span></td>
                            <td>
                              <span class="badge ${log.success ? 'badge-success' : 'badge-error'}">
                                ${log.success ? 'Success' : 'Failed'}
                              </span>
                            </td>
                            <td style="font-family: monospace; font-size: 0.8rem;">${log.tweet_id || 'N/A'}</td>
                            <td style="max-width: 350px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(log.joke || '')}">${escapeHtml(log.joke || '')}</td>
                          </tr>
                        `;
                      }).join('')}
                      ${recentLogs.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No attempts recorded yet.</td></tr>' : ''}
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="panel">
                <div class="panel-title">Upcoming Pending Jokes (Next 5)</div>
                <div style="overflow-x: auto;">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Category</th>
                        <th>Joke Text</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${upcomingJokes.map(jk => `
                        <tr>
                          <td>#${jk.id}</td>
                          <td><span class="badge badge-pending">${escapeHtml(jk.category)}</span></td>
                          <td>${escapeHtml(jk.joke)}</td>
                        </tr>
                      `).join('')}
                      ${upcomingJokes.length === 0 ? '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No pending jokes available! Seeding might be empty.</td></tr>' : ''}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              <div class="panel">
                <div class="panel-title">Add New Joke</div>
                <form action="/jokes/add" method="POST" style="display: flex; flex-direction: column; gap: 1rem;">
                  <div class="form-group">
                    <label for="category">Category</label>
                    <select name="category" id="category" required>
                      <option value="Programming">Programming</option>
                      <option value="Dad Jokes">Dad Jokes</option>
                      <option value="Office">Office</option>
                      <option value="College">College</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Technology">Technology</option>
                      <option value="Relationship">Relationship</option>
                      <option value="Animals">Animals</option>
                      <option value="Puns">Puns</option>
                      <option value="Random">Random</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="joke">Joke Content</label>
                    <textarea name="joke" id="joke" rows="4" placeholder="Type a funny joke here..." required></textarea>
                  </div>
                  <button type="submit" class="btn">Add Joke</button>
                </form>
              </div>

              <div class="panel">
                <div class="panel-title">Configuration Info</div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Port:</span>
                    <span>${port}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Cron Schedule:</span>
                    <span><code>${schedulerStatus.interval}</code></span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Max Retries:</span>
                    <span>${process.env.MAX_RETRY || '3'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Exhaustion Strategy:</span>
                    <span style="text-transform: capitalize;">${process.env.ON_EXHAUSTION || 'reset'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Database Path:</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);" title="${path.resolve(process.env.DATABASE_PATH || 'src/database/jokes.db')}">${path.basename(process.env.DATABASE_PATH || 'jokes.db')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="toast" class="toast"></div>

        <script>
          function showToast(message, isSuccess = true) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.borderColor = isSuccess ? 'var(--accent-success)' : 'var(--accent-error)';
            toast.style.display = 'block';
            setTimeout(() => {
              toast.style.display = 'none';
            }, 3000);
          }

          async function triggerJob() {
            const btn = document.getElementById('triggerBtn');
            btn.disabled = true;
            btn.textContent = 'Posting...';
            try {
              const res = await fetch('/debug/trigger-job', { method: 'POST' });
              const data = await res.json();
              if (data.success) {
                showToast('Joke posted successfully!');
                setTimeout(() => window.location.reload(), 1500);
              } else {
                showToast('Failed: ' + data.error, false);
                btn.disabled = false;
                btn.textContent = '⚡ Trigger Post Now';
              }
            } catch (err) {
              showToast('Error: ' + err.message, false);
              btn.disabled = false;
              btn.textContent = '⚡ Trigger Post Now';
            }
          }
        </script>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    logger.error('Dashboard rendering error: %s', error.message);
    res.status(500).send('An error occurred loading the dashboard.');
  }
});

// JSON API endpoints
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    scheduler: schedulerService.getStatus(),
    jobStatus: getJobStatus()
  });
});

app.post('/debug/trigger-job', async (req, res) => {
  try {
    await runJokePostingJob();
    res.json({ success: true, message: 'Posting job executed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/jokes/add', async (req, res) => {
  const { joke, category } = req.body;
  try {
    await jokeService.addJoke(joke, category);
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Failed to add joke: ' + err.message);
  }
});

// Helper function to escape HTML characters
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled express route error: %s', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialization sequence
async function startServer() {
  try {
    // 1. Connect database & run migrations
    await db.connect();

    // 2. Initialize Bluesky client (login)
    await bluesky.initialize();
    
    // 3. Start Express app
    app.listen(port, () => {
      logger.info('AutoJokeX HTTP Server listening on port %d.', port);
    });

    // 4. Start scheduler
    schedulerService.start();
  } catch (err) {
    logger.error('Fatal crash on startup: %s', err.message);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Initiating graceful shutdown.');
  schedulerService.stop();
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Initiating graceful shutdown.');
  schedulerService.stop();
  await db.close();
  process.exit(0);
});

// Run server only if not in testing environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app; // export for testing
