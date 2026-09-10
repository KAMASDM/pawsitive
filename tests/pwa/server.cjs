const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let version = 1;
const root = path.resolve('build');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  if (req.url === '/__next-worker' && req.method === 'POST') { version++; res.end('ok'); return; }
  const requested = new URL(req.url, 'http://localhost').pathname;
  let file = path.resolve(root, '.' + requested);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  const data = fs.readFileSync(file);
  res.end(requested === '/sw.js' ? Buffer.concat([data, Buffer.from(`\n// Test release ${version}\n`)]) : data);
}).listen(4180, '127.0.0.1');
