#!/usr/bin/env node
/**
 * Content-provenance guard — proves the doctrine invariant over committed SOURCE (not build output),
 * so it needs no build and no network and runs in CI next to the other guards.
 *
 * See scripts/content/lib/verify.mjs for exactly what it enforces and — importantly — the PRECISE
 * guarantee it makes (the passes never ran over verbatim material + frozen doctrine is untampered;
 * NOT doctrinal fidelity, which is the owner's human review).
 *
 * Run via `pnpm guard:provenance`.
 */
import { verifyProvenance } from './content/lib/verify.mjs';

const CONTENT_ROOT = 'src/content';
const REGISTRY = 'scripts/content/doctrine-registry.json';

const { ok, violations, checked } = verifyProvenance({
	contentRoot: CONTENT_ROOT,
	registryPath: REGISTRY
});

if (!ok) {
	console.error(`\n✗ Content-provenance guard: ${violations.length} violation(s):\n`);
	for (const v of violations) console.error(`   - ${v}`);
	console.error('');
	process.exit(1);
}

console.log(`✓ Content-provenance: ${checked} topic(s) checked, doctrine invariant holds.`);
