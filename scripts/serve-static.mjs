#!/usr/bin/env node
/**
 * Minimal zero-dependency static file server for the prerendered `build/` output.
 *
 * Stands in for the production nginx container so the offline invariant can be verified locally
 * and in CI without a browser. Serves clean directory URLs (`/x/` -> `/x/index.html`).
 *
 * As a library: `import { createStaticServer } from './serve-static.mjs'`.
 * As a CLI: `node scripts/serve-static.mjs [port] [dir]`.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

async function resolveFile(root, urlPath) {
	// Strip query/hash, decode, and prevent path traversal outside ROOT.
	const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
	const rel = normalize(clean).replace(/^(\.\.[/\\])+/, '');
	const candidates = [join(root, rel)];
	if (clean.endsWith('/')) candidates.push(join(root, rel, 'index.html'));
	else candidates.push(join(root, rel, 'index.html'), `${join(root, rel)}.html`);
	for (const c of candidates) {
		try {
			if ((await stat(c)).isFile()) return c;
		} catch {
			/* try next */
		}
	}
	return null;
}

/** Create (but do not start) a static server rooted at `root`. */
export function createStaticServer(root = 'build') {
	return createServer(async (req, res) => {
		const file = await resolveFile(root, req.url ?? '/');
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
}

// CLI entry.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);
	const root = process.argv[3] ?? 'build';
	createStaticServer(root).listen(port, () => {
		console.log(`Serving ${root}/ at http://localhost:${port}/`);
	});
}
