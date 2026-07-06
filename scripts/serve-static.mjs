#!/usr/bin/env node
/**
 * Minimal zero-dependency static file server for the prerendered `build/` output.
 *
 * Stands in for the production nginx container so the offline invariant can be
 * verified locally and in CI (`pnpm serve:static`, then hit it with the browser
 * offline / Playwright). Serves clean directory URLs (`/x/` -> `/x/index.html`).
 *
 * Usage: node scripts/serve-static.mjs [port] [dir]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4173);
const ROOT = process.argv[3] ?? 'build';

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.txt': 'text/plain; charset=utf-8',
	'.webmanifest': 'application/manifest+json',
	'.woff2': 'font/woff2'
};

async function resolve(urlPath) {
	// Strip query/hash, decode, and prevent path traversal outside ROOT.
	const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
	const rel = normalize(clean).replace(/^(\.\.[/\\])+/, '');
	const candidates = [join(ROOT, rel)];
	if (clean.endsWith('/')) candidates.push(join(ROOT, rel, 'index.html'));
	else candidates.push(join(ROOT, rel, 'index.html'), `${join(ROOT, rel)}.html`);
	for (const c of candidates) {
		try {
			const s = await stat(c);
			if (s.isFile()) return c;
		} catch {
			/* try next */
		}
	}
	return null;
}

const server = createServer(async (req, res) => {
	const file = await resolve(req.url ?? '/');
	if (!file) {
		res.writeHead(404, { 'content-type': 'text/plain' });
		res.end('404 Not Found');
		return;
	}
	try {
		const body = await readFile(file);
		res.writeHead(200, {
			'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream'
		});
		res.end(body);
	} catch {
		res.writeHead(500, { 'content-type': 'text/plain' });
		res.end('500 Internal Server Error');
	}
});

server.listen(PORT, () => {
	console.log(`Serving ${ROOT}/ at http://localhost:${PORT}/`);
});
