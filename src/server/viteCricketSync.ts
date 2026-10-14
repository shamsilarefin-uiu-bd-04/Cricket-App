import type { Plugin } from 'vite';
import os from 'os';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

export function cricketSyncPlugin(): Plugin {
  const DATA_DIR = path.resolve(process.cwd(), 'data');
  const DB_FILE = path.join(DATA_DIR, 'cricket-db.json');
  let serverState: any = null;
  let version = 1;
  const sseClients = new Set<ServerResponse>();

  // Load existing persistent state on startup
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      serverState = JSON.parse(content);
      version = serverState?.version || 1;
      console.log(`[Mobile Server] Loaded persistent tournament & match state (v${version}) from ${DB_FILE}`);
    }
  } catch (err) {
    console.error('[Mobile Server] Error reading cricket-db.json:', err);
  }

  function broadcast(type: string, data: any) {
    const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
    for (const client of Array.from(sseClients)) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  // Heartbeat to keep mobile connections alive
  setInterval(() => {
    for (const client of Array.from(sseClients)) {
      try {
        client.write(':keepalive\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 20000);

  function setupMiddleware(middlewares: any, defaultPort: number) {
    middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const url = req.url?.split('?')[0];

      // 1. IP and Cloud discovery endpoint
      if (url === '/api/network-ip' && req.method === 'GET') {
        const hostHeader = (req.headers.host || '').trim();
        const forwardedProto = req.headers['x-forwarded-proto'];
        const isHttps = forwardedProto === 'https' || (req.socket as any).encrypted;
        const proto = isHttps ? 'https' : 'http';

        const isLocalHost =
          !hostHeader ||
          hostHeader.startsWith('localhost') ||
          hostHeader.startsWith('127.0.0.1') ||
          hostHeader.startsWith('192.168.') ||
          hostHeader.startsWith('10.');

        const ifaces = os.networkInterfaces();
        const interfaces: { name: string; ip: string }[] = [];
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

        const port = defaultPort;

        if (process.env.PUBLIC_URL) {
          const cleanPublicUrl = process.env.PUBLIC_URL.replace(/\/$/, '');
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ip: hostHeader,
              port,
              url: cleanPublicUrl,
              isCloud: true,
              publicUrl: cleanPublicUrl,
              interfaces: [{ name: 'Cloud URL', ip: cleanPublicUrl }, ...interfaces],
              connectedClients: sseClients.size
            })
          );
          return;
        }

        if (!isLocalHost) {
          const cloudUrl = `${proto}://${hostHeader}`;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ip: hostHeader.split(':')[0],
              port,
              url: cloudUrl,
              isCloud: true,
              publicUrl: cloudUrl,
              interfaces: [{ name: 'Cloud Domain', ip: hostHeader }, ...interfaces],
              connectedClients: sseClients.size
            })
          );
          return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            ip: primaryIp,
            port,
            url: `http://${primaryIp}:${port}`,
            isCloud: false,
            interfaces,
            connectedClients: sseClients.size
          })
        );
        return;
      }

      // 2. Real-time Server-Sent Events (SSE) stream
      if (url === '/api/stream' && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive'
        });

        sseClients.add(res);

        // Notify client of connection & current state
        res.write(`data: ${JSON.stringify({ type: 'CLIENTS_COUNT', count: sseClients.size })}\n\n`);
        if (serverState) {
          res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', data: serverState })}\n\n`);
        }

        // Broadcast updated spectator count to all devices
        broadcast('CLIENTS_COUNT', sseClients.size);

        req.on('close', () => {
          sseClients.delete(res);
          broadcast('CLIENTS_COUNT', sseClients.size);
        });
        return;
      }

      // 3. State sync GET
      if (url === '/api/sync' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(serverState || {}));
        return;
      }

      // 4. State sync POST (Admin pushes score/match update)
      if (url === '/api/sync' && req.method === 'POST') {
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
              updatedAt: Date.now()
            };

            // Save to disk asynchronously
            if (!fs.existsSync(DATA_DIR)) {
              fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            fs.writeFile(DB_FILE, JSON.stringify(serverState, null, 2), (err) => {
              if (err) console.error('[Mobile Server] Error saving database:', err);
            });

            // Push update to all connected mobile devices!
            broadcast('SYNC_UPDATE', serverState);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, version }));
          } catch (err: any) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      next();
    });
  }

  return {
    name: 'cricket-sync-server',
    configureServer(server) {
      const port = (server.config.server.port as number) || 5173;
      setupMiddleware(server.middlewares, port);
    },
    configurePreviewServer(server) {
      const port = (server.config.preview.port as number) || 5173;
      setupMiddleware(server.middlewares, port);
    }
  };
}
