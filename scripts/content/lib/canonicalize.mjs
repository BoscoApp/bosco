/**
 * The ONE text normalizer shared by emit (when it freezes a verbatim body) and the guard (when it
 * re-hashes that body). Strips a leading UTF-8 BOM, collapses CRLF/CR to LF, and guarantees exactly
 * one trailing newline. Because both sides run text through here before hashing, a verbatim doctrine
 * body's recorded SHA-256 matches its on-disk bytes even when Git checks the file out with different
 * line endings on Windows vs Linux CI. (`.gitattributes` already pins `* text=auto eol=lf`, so in
 * practice the tree is LF everywhere — this is belt-and-suspenders for the doctrine sha lock.)
 *
 * @param {string} text
 * @returns {string}
 */
export function canonicalize(text) {
	const body = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
	return body.replace(/\n+$/, '') + '\n';
}

/**
 * SHA-256 (hex) of the canonicalized text. Used to freeze verbatim doctrine: emit records this over
 * each verbatim tier body, and the guard re-computes it from the on-disk file and fails if it drifts
 * — so frozen doctrine can never be hand-edited after emit without the guard noticing.
 *
 * Imported lazily (`node:crypto`) so this module stays trivially importable by pure logic that never
 * needs a hash (e.g. the review-queue formatter).
 *
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function sha256(text) {
	const { createHash } = await import('node:crypto');
	return createHash('sha256').update(canonicalize(text), 'utf8').digest('hex');
}
