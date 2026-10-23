#!/usr/bin/env node
// Keep the current and two prior releases' hashed assets available to open tabs.
// Run after Vite/PWA generation, so the new worker precaches only its own release.
const fs = require('node:fs/promises');
const path = require('node:path');
const SITE = 'https://pawppy.in';
const ORIGIN = /^https:\/\/[a-f0-9]{24}--pawppy\.netlify\.app$/;
const ASSET = /^assets\/[a-zA-Z0-9_.-]+\.(?:js|mjs|css|svg|png|jpg|jpeg|webp|woff2?)$/;
const BOOTSTRAP = [
  'https://6aa2aa04c6fb5b00086ede30--pawppy.netlify.app',
  'https://6aa2a4779dae4a71334fd838--pawppy.netlify.app',
];
const output = path.resolve('build');
async function fetchFile(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
  if (!response.ok) throw new Error(`Asset retention failed: ${response.status} for ${url}`);
  return response;
}
async function manifestFromWorker(origin) {
  const source = await (await fetchFile(`${origin}/sw.js`)).text();
  const assets = [...source.matchAll(/\burl"?\s*:\s*"(assets\/[^"\n]+)"/g)].map(match => match[1]).filter(name => ASSET.test(name));
  if (!assets.length) throw new Error(`No release assets found at ${origin}`);
  return { origin, assets: [...new Set(assets)] };
}
async function main() {
  if (process.env.NETLIFY !== 'true' && !process.argv.includes('--verify-history')) return;
  const response = await fetchFile(`${SITE}/release-assets.json`);
  let previous;
  // The first migration predates this manifest; its SPA fallback returns HTML.
  if (response.headers.get('content-type')?.includes('application/json')) {
    const manifest = await response.json();
    previous = manifest.releases?.slice(0, 2);
    if (!previous?.length || previous.some(release => !ORIGIN.test(release.origin) || !Array.isArray(release.assets) || !release.assets.length || release.assets.some(asset => !ASSET.test(asset)))) throw new Error('Invalid deployed asset manifest');
  } else {
    previous = await Promise.all(BOOTSTRAP.map(manifestFromWorker));
  }
  // Capture this build's assets before copying history, to bound retention.
  const currentAssets = (await fs.readdir(path.join(output, 'assets'))).map(name => `assets/${name}`).filter(name => ASSET.test(name));
  let retained = 0;
  for (const release of previous) {
    const queue = [...release.assets];
    await Promise.all(Array.from({ length: 6 }, async () => {
      for (;;) {
        const asset = queue.shift();
        if (!asset) return;
        const target = path.join(output, asset);
        try { await fs.access(target); continue; } catch { /* Fetch only missing assets. */ }
        const response = await fetchFile(`${release.origin}/${asset}`);
        const type = response.headers.get('content-type') || '';
        if (type.includes('text/html') || ((asset.endsWith('.js') || asset.endsWith('.mjs')) && !/javascript|ecmascript/.test(type))) throw new Error(`Invalid asset MIME type for ${asset}`);
        const body = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(target, body, { flag: 'wx' });
        retained++;
      }
    }));
  }
  const deployId = process.env.DEPLOY_ID;
  if (process.env.NETLIFY === 'true' && !/^[a-f0-9]{24}$/.test(deployId || '')) throw new Error('Netlify deploy ID is required for asset retention');
  const releases = deployId ? [{ origin: `https://${deployId}--pawppy.netlify.app`, assets: currentAssets }, ...previous] : previous;
  await fs.writeFile(path.join(output, 'release-assets.json'), JSON.stringify({ releases }, null, 2));
  console.log(`Retained ${retained} assets from ${previous.length} previous releases.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
