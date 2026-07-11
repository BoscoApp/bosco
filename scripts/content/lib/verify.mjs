import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import { canonicalize } from './canonicalize.mjs';
import { FAKE_SENTINEL } from '../generators/fake.mjs';

/**
 * Verify content provenance over committed source (NOT build output — this reads `src/content/**`, so
 * it needs no build and no network). It enforces, structurally, the two invariants the project exists
 * to protect:
 *
 *   THE DOCTRINE INVARIANT — doctrine is byte-copied, never adapted:
 *     • Every `faith/**` topic MUST have a `provenance.json` (fail-closed: doctrine cannot dodge the
 *       tool into production). This — not the registry — is the load-bearing structural gate.
 *     • Any path the doctrine-registry marks MUST be `verbatim`; an adapted sidecar there is fatal.
 *     • A verbatim topic whose any tier was produced by a pass (method !== 'verbatim') is fatal.
 *     • A verbatim tier's on-disk body must still hash to its recorded sha256 (frozen doctrine can't
 *       be hand-edited after emit).
 *
 *   THE GATE INVARIANT — placeholder filler never ships:
 *     • An `approved` topic with any FAKE-generated tier (or the fake sentinel in a tier body) is fatal.
 *
 * PRECISE GUARANTEE (be honest about it): this proves the ADAPTATION PASSES never ran over verbatim
 * material and that frozen doctrine is UNTAMPERED SINCE EMIT. It does NOT prove doctrinal fidelity —
 * that the verbatim bytes are the true text is the owner's review, not something a hash can decide.
 *
 * @param {{ contentRoot: string, registryPath?: string }} opts
 * @returns {{ ok: boolean, violations: string[], checked: number }}
 */
export function verifyProvenance({ contentRoot, registryPath }) {
	const violations = [];
	const registry = loadRegistry(registryPath);
	let checked = 0;

	if (!existsSync(contentRoot)) return { ok: true, violations, checked };

	for (const cat of readdirSync(contentRoot, { withFileTypes: true })) {
		if (!cat.isDirectory()) continue;
		const catDir = join(contentRoot, cat.name);

		for (const topic of readdirSync(catDir, { withFileTypes: true })) {
			if (!topic.isDirectory()) continue;
			const topicDir = join(catDir, topic.name);
			const indexPath = join(topicDir, 'index.md');
			if (!existsSync(indexPath)) continue; // inert folder (no index.md) — the plugin skips it too

			checked++;
			const topicPath = `${cat.name}/${topic.name}`;
			const sidecarPath = join(topicDir, 'provenance.json');
			const hasSidecar = existsSync(sidecarPath);

			// (1) Mandatory faith provenance — the structural doctrine gate.
			if (cat.name === 'faith' && !hasSidecar) {
				violations.push(
					`${topicPath}: a faith topic has no provenance.json. All doctrine must be authored ` +
						`through the content pipeline (\`pnpm content:gen\`) so its verbatim/adapted status is on record.`
				);
			}

			// (2) Registry: this path MUST be verbatim.
			const mustBeVerbatim = matchesAny(topicPath, registry);
			if (mustBeVerbatim && !hasSidecar) {
				violations.push(
					`${topicPath}: doctrine-registry marks this as verbatim, but it has no provenance.json.`
				);
			}

			if (!hasSidecar) continue;

			let sidecar;
			try {
				sidecar = JSON.parse(readFileSync(sidecarPath, 'utf8'));
			} catch (e) {
				violations.push(`${topicPath}: provenance.json is not valid JSON (${e.message}).`);
				continue;
			}

			if (mustBeVerbatim && sidecar.content_kind !== 'verbatim') {
				violations.push(
					`${topicPath}: doctrine-registry marks this as verbatim, but its provenance says ` +
						`content_kind="${sidecar.content_kind}". Doctrine must be byte-copied, never adapted.`
				);
			}

			// Parse index.md once: review_status + the DECLARED tiers (what actually renders/ships).
			// Best-effort — an unparseable index.md fails the real build, not this guard.
			let reviewStatus = 'unknown';
			let declaredTiers = [];
			try {
				const fm = matter(readFileSync(indexPath, 'utf8')).data;
				reviewStatus = fm.review_status ?? 'unknown';
				if (Array.isArray(fm.tiers)) {
					declaredTiers = fm.tiers.map(Number).filter((n) => Number.isInteger(n));
				}
			} catch {
				// leave defaults
			}

			// Check EVERY tier that renders (declared in index.md), has a body on disk, OR is listed in the
			// sidecar — the union — so a tier can't dodge the doctrine/gate checks by being absent from the
			// sidecar (a rendered-but-unlisted tier) or from index.md.
			const sidecarTiers = sidecar.tiers ?? {};
			const onDiskTiers = readdirSync(topicDir)
				.map((f) => /^tier-(\d+)\.md$/.exec(f))
				.filter(Boolean)
				.map((m) => Number(m[1]));
			const tiersToCheck = [
				...new Set([...declaredTiers, ...onDiskTiers, ...Object.keys(sidecarTiers).map(Number)])
			].sort((a, b) => a - b);

			for (const tier of tiersToCheck) {
				const rec = sidecarTiers[tier];
				const tierFile = join(topicDir, `tier-${tier}.md`);
				const body = existsSync(tierFile) ? readFileSync(tierFile, 'utf8') : null;
				const rendered = declaredTiers.includes(tier); // what actually ships

				// (3) A verbatim topic's RENDERED tiers must each be provably frozen doctrine.
				if (sidecar.content_kind === 'verbatim' && rendered) {
					if (!rec) {
						violations.push(
							`${topicPath} tier ${tier}: a verbatim topic renders tier-${tier}.md but its ` +
								`provenance.json has no record for it — the frozen body cannot be verified.`
						);
					} else if (rec.method !== 'verbatim') {
						violations.push(
							`${topicPath} tier ${tier}: verbatim topic has a "${rec.method}" tier — an adaptation ` +
								`pass ran over doctrine.`
						);
					} else if (!rec.sha256) {
						violations.push(
							`${topicPath} tier ${tier}: verbatim tier has no recorded sha256 — the frozen-doctrine ` +
								`body cannot be verified. Re-run the spec to re-freeze it.`
						);
					} else if (!body) {
						violations.push(`${topicPath} tier ${tier}: verbatim body tier-${tier}.md is missing.`);
					} else if (shaOf(body) !== rec.sha256) {
						violations.push(
							`${topicPath} tier ${tier}: verbatim body was edited after emit (sha mismatch). ` +
								`Correct doctrine by re-running the spec, not by hand-editing tier-${tier}.md.`
						);
					}
				}

				// (3b) Any verbatim-marked sidecar record honours its freeze, even a non-rendered one or a
				// verbatim tier on an otherwise-adapted topic (catches contamination outside the ship surface).
				if (
					rec &&
					rec.method === 'verbatim' &&
					!(sidecar.content_kind === 'verbatim' && rendered)
				) {
					if (!rec.sha256) {
						violations.push(
							`${topicPath} tier ${tier}: a verbatim-marked tier has no recorded sha256.`
						);
					} else if (body && shaOf(body) !== rec.sha256) {
						violations.push(
							`${topicPath} tier ${tier}: verbatim body was edited after emit (sha mismatch).`
						);
					}
				}

				// (4) A verbatim topic must not carry an adapted tier record anywhere in its sidecar.
				if (sidecar.content_kind === 'verbatim' && rec && rec.method !== 'verbatim') {
					violations.push(
						`${topicPath} tier ${tier}: verbatim topic has a "${rec.method}" sidecar record — ` +
							`doctrine must be byte-copied, never adapted.`
					);
				}

				// (5) Gate: fake filler must never reach an approved topic — by provenance OR by body bytes,
				// so a tampered/omitted sidecar can't smuggle placeholder prose past the gate.
				if (reviewStatus === 'approved') {
					if (rec && rec.generator === 'fake') {
						violations.push(
							`${topicPath} tier ${tier}: an APPROVED topic still has a FAKE-generated body. ` +
								`Regenerate with the real adapter (or hand-write) before approving.`
						);
					}
					if (body && body.includes(FAKE_SENTINEL)) {
						violations.push(
							`${topicPath} tier ${tier}: an APPROVED body still contains the fake-draft sentinel.`
						);
					}
				}
			}
		}
	}

	return { ok: violations.length === 0, violations, checked };
}

/** @returns {string[]} the list of must-be-verbatim path patterns. */
function loadRegistry(registryPath) {
	if (!registryPath || !existsSync(registryPath)) return [];
	const data = JSON.parse(readFileSync(registryPath, 'utf8'));
	return Array.isArray(data.verbatim) ? data.verbatim : [];
}

/**
 * Match a `category/slug` path against simple registry patterns. `*` matches within one path segment
 * (e.g. `faith/*`, `faith/catechism-*`); no full glob, no dependency. Exact strings match exactly.
 */
function matchesAny(topicPath, patterns) {
	return patterns.some((pat) => {
		const re = new RegExp(
			'^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$'
		);
		return re.test(topicPath);
	});
}

function shaOf(text) {
	// Synchronous sha for the guard; mirrors canonicalize() before hashing so it matches the async
	// sha256() emit recorded, regardless of checkout line endings.
	return createHash('sha256').update(canonicalize(text), 'utf8').digest('hex');
}
