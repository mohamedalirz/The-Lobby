const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ===================== DATABASE SETUP =====================

const db = new DatabaseSync(path.join(__dirname, 'thelobby.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS app_data (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  )
`);

const DEFAULT_DATA = JSON.stringify({
  tournaments: {},
  stats: { matches: 0, champions: 0 }
});

const existing = db.prepare('SELECT id FROM app_data WHERE id = 1').get();
if (!existing) {
  db.prepare('INSERT INTO app_data (id, data) VALUES (1, ?)').run(DEFAULT_DATA);
}

function getData() {
  const row = db.prepare('SELECT data FROM app_data WHERE id = 1').get();
  return row.data;
}

function setData(jsonString) {
  db.prepare('UPDATE app_data SET data = ? WHERE id = 1').run(jsonString);
}

// ===================== STATIC FILE SERVING =====================

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, urlPath) {
  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // Prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Fallback to index.html for client-side routing
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, indexContent) => {
        if (err2) {
          res.writeHead(404);
          return res.end('Not found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexContent);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ===================== REQUEST HANDLER =====================

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // CORS (useful if frontend is served separately during development)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (urlPath === '/api/data') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(getData());
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          setData(JSON.stringify(parsed));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      setData(DEFAULT_DATA);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, data: JSON.parse(DEFAULT_DATA) }));
    }
  }

  if (req.method === 'GET') {
    return serveStatic(req, res, urlPath);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`THE LOBBY server running at http://localhost:${PORT}`);
  console.log(`Database file: ${path.join(__dirname, 'thelobby.db')}`);
});
