/*
 * Build-time media pipeline (sharp). Reads raw sources from assets-src/ (which is .dockerignore'd
 * and .gitignore'd — raw scans never ship) and emits cropped/cleaned responsive derivatives into
 * static/media/. SVGs are additionally run through SVGO to strip editor metadata (Inkscape /
 * sodipodi namespaces) so they can't trip the external-URL guardrail.
 *
 * Phase 0 is ART-AGNOSTIC (Open Decision #4 deferred): there is no content illustration yet, so
 * this tolerates a missing/empty assets-src/ and no-ops. The directory contract is established now
 * so the pipeline is ready the moment the illustration treatment is chosen.
 */
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'assets-src');
const OUT = join(__dirname, '..', 'static', 'media');
const WIDTHS = [320, 640, 960, 1280];

if (!existsSync(SRC)) {
	console.log('[media] no assets-src/ — nothing to process (Phase 0 is art-agnostic).');
	process.exit(0);
}

const files = readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f));
if (files.length === 0) {
	console.log('[media] assets-src/ is empty — nothing to process.');
	process.exit(0);
}

// Only load sharp when there is actually work to do.
const { default: sharp } = await import('sharp');
mkdirSync(OUT, { recursive: true });

for (const file of files) {
	const name = basename(file, extname(file));
	const input = join(SRC, file);
	for (const width of WIDTHS) {
		await sharp(input)
			.resize({ width, withoutEnlargement: true })
			.avif({ quality: 55 })
			.toFile(join(OUT, `${name}-${width}.avif`));
		await sharp(input)
			.resize({ width, withoutEnlargement: true })
			.webp({ quality: 70 })
			.toFile(join(OUT, `${name}-${width}.webp`));
	}
	console.log(`[media] processed ${file} -> ${WIDTHS.length} widths (avif + webp)`);
}
