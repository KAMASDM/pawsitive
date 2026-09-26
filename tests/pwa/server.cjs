const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let version = 1;
let installDelay = 0;
let releaseOverride = null;
let navigationUnavailable = false;
const root = path.resolve('build');
const types = { '.json': 'application/json', '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  if (req.url === '/__release-version' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { releaseOverride = JSON.parse(body).buildId || null; res.end('ok'); });
    return;
  }
  if (req.url === '/__reset' && req.method === 'POST') { releaseOverride = null; navigationUnavailable = false; installDelay = 0; res.end('ok'); return; }
  if (req.url === '/__fail-navigation' && req.method === 'POST') { navigationUnavailable = true; res.end('ok'); return; }
  if (['/__next-worker', '/__slow-worker'].includes(req.url) && req.method === 'POST') { version++; installDelay = req.url === '/__slow-worker' ? 35000 : 0; res.end('ok'); return; }
  const requested = new URL(req.url, 'http://localhost').pathname;
  let file = path.resolve(root, '.' + requested);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (requested.startsWith('/assets/')) { res.writeHead(404, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); res.end('Missing app asset'); return; }
    file = path.join(root, 'index.html');
  }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  if (requested === '/version.json' && releaseOverride) { res.end(JSON.stringify({ buildId: releaseOverride })); return; }
  const data = fs.readFileSync(file);
  if (path.basename(file) === 'index.html') {
    if (navigationUnavailable) { res.destroy(); return; }
    res.end(data.toString().replace('<html lang="en">', `<html lang="en" data-release="${version}">`));
    return;
  }
  res.end(requested === '/sw.js' ? Buffer.concat([data, Buffer.from(`\n// Test release ${version}\nself.addEventListener("install", event => event.waitUntil(new Promise(resolve => setTimeout(resolve, ${installDelay}))));\n`)]) : data);
}).listen(4180, '127.0.0.1');
