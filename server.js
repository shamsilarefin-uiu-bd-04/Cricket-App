import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
const HOST = '0.0.0.0';
const DIST_DIR = path.resolve(__dirname, 'dist');
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'cricket-db.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

let serverState = null;
let version = 1;
const sseClients = new Set();

// Load persistent tournament state on startup
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    serverState = JSON.parse(raw);
    version = serverState?.version || 1;
    console.log(`[Cloud Server] Loaded tournament state (v${version}) from ${DB_FILE}`);
  }
} catch (err) {
  console.warn('[Cloud Server] Notice: Initial state file not loaded, will create on first save:', err.message);
}

function broadcast(type, data) {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  for (const client of Array.from(sseClients)) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep-alive heartbeat for cloud connections (SSE)
setInterval(() => {
  for (const client of Array.from(sseClients)) {
    try {
      client.write(':keepalive\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 20000);

function getNetworkInfo(req) {
  const hostHeader = (req?.headers?.host || '').trim();
  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const isHttps = forwardedProto === 'https' || (req?.socket && req.socket.encrypted);
  const proto = isHttps ? 'https' : 'http';

  const isLocalHost =
    !hostHeader ||
    hostHeader.startsWith('localhost') ||
    hostHeader.startsWith('127.0.0.1') ||
    hostHeader.startsWith('192.168.') ||
    hostHeader.startsWith('10.');

  if (process.env.PUBLIC_URL) {
    const cleanPublicUrl = process.env.PUBLIC_URL.replace(/\/$/, '');
    return {
      ip: hostHeader,
      port: PORT,
      url: cleanPublicUrl,
      isCloud: true,
      publicUrl: cleanPublicUrl,
      interfaces: [{ name: 'Cloud URL (PUBLIC_URL)', ip: cleanPublicUrl }],
      connectedClients: sseClients.size
    };
  }

  if (!isLocalHost) {
    const cloudUrl = `${proto}://${hostHeader}`;
    return {
      ip: hostHeader.split(':')[0],
      port: PORT,
      url: cloudUrl,
      isCloud: true,
      publicUrl: cloudUrl,
      interfaces: [{ name: 'Cloud Domain', ip: hostHeader }],
      connectedClients: sseClients.size
    };
  }

  // Local Network Interfaces
  const ifaces = os.networkInterfaces();
  const interfaces = [];
  let primaryIp = '127.0.0.1';

  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        interfaces.push({ name, ip: iface.address });
        if (
          primaryIp === '127.0.0.1' ||
          iface.address.startsWith('192.168.') ||
          iface.address.startsWith('10.')
        ) {
          primaryIp = iface.address;
        }
      }
    }
  }

  return {
    ip: primaryIp,
    port: PORT,
    url: `http://${primaryIp}:${PORT}`,
    isCloud: false,
    interfaces,
    connectedClients: sseClients.size
  };
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. IP & Cloud URL discovery endpoint
  if (pathname === '/api/network-ip' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(getNetworkInfo(req)));
    return;
  }

  // 2. Real-time SSE stream for live score updates
  if (pathname === '/api/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    sseClients.add(res);

    res.write(`data: ${JSON.stringify({ type: 'CLIENTS_COUNT', count: sseClients.size })}\n\n`);
    if (serverState) {
      res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', data: serverState })}\n\n`);
    }

    broadcast('CLIENTS_COUNT', sseClients.size);

    req.on('close', () => {
      sseClients.delete(res);
      broadcast('CLIENTS_COUNT', sseClients.size);
    });
    return;
  }

  // 3. State sync GET
  if (pathname === '/api/sync' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(serverState || {}));
    return;
  }

  // 4. State sync POST (Admin updates)
  if (pathname === '/api/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        version++;
        serverState = {
          ...incoming,
          version,
          timestamp: incoming.timestamp || Date.now(),
          updatedAt: Date.now()
        };

        try {
          if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
          }
          fs.writeFile(DB_FILE, JSON.stringify(serverState, null, 2), () => {});
        } catch (e) {
          console.warn('[Cloud Server] Warning: Could not write to disk, kept in memory:', e.message);
        }

        broadcast('SYNC_UPDATE', serverState);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, version }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. Static file serving from dist/
  if (req.method === 'GET' || req.method === 'HEAD') {
    let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

    // Prevent directory traversal attacks
    if (!filePath.startsWith(DIST_DIR)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      // If file doesn't exist, fallback to dist/index.html (SPA routing)
      if (err || !stats.isFile()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const isHtml = ext === '.html';

      res.setHeader('Content-Type', contentType);

      if (isHtml) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }

      if (req.method === 'HEAD') {
        res.statusCode = 200;
        res.end();
        return;
      }

      const acceptEncoding = req.headers['accept-encoding'] || '';
      if (
        acceptEncoding.includes('gzip') &&
        (isHtml || ext === '.js' || ext === '.css' || ext === '.json' || ext === '.svg')
      ) {
        res.setHeader('Content-Encoding', 'gzip');
        const raw = fs.createReadStream(filePath);
        const gzip = zlib.createGzip();
        raw.pipe(gzip).pipe(res);
      } else {
        const raw = fs.createReadStream(filePath);
        raw.pipe(res);
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🏏 Cricbuzz Live Cricket Cloud Production Server`);
  console.log(`🌐 Listening on: http://${HOST}:${PORT}`);
  console.log(`📦 Serving static files from: ${DIST_DIR}`);
  console.log(`☁️ Cloud Ready for Render, Railway, Vercel, VPS & Tunnel`);
  console.log(`=======================================================`);
});

if (PORT !== 5173) {
  try {
    const secondaryServer = http.createServer(server.listeners('request')[0]);
    secondaryServer.listen(5173, HOST, () => {
      console.log(`🌐 Fallback port 5173 active for internal routing.`);
    });
  } catch (err) {
    // ignore if unavailable
  }
}
