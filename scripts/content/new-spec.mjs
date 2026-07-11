#!/usr/bin/env node
/**
 * Scaffold a new topic spec with the correct shape for its kind. This nudges correct authoring: the
 * verbatim stub is a label-only `## all` body (no adaptable free text), so doctrine starts un-adaptable
 * by construction rather than by the author remembering to.
 *
 *   pnpm content:new creatures/red-fox --kind=adapted
 *   pnpm content:new faith/hail-mary --kind=verbatim
 */
import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SPECS_ROOT = 'scripts/content/specs';

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: { kind: { type: 'string' } }
});

const path = positionals[0];
const kind = values.kind ?? 'adapted';

if (!path || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(path)) {
	console.error(
		'usage: node scripts/content/new-spec.mjs <category>/<slug> --kind=adapted|verbatim'
	);
	process.exit(1);
}
if (kind !== 'adapted' && kind !== 'verbatim') {
	console.error(`✗ --kind must be "adapted" or "verbatim" (got "${kind}").`);
	process.exit(1);
}

const [category, slug] = path.split('/');
const outPath = join(SPECS_ROOT, category, `${slug}.topic.md`);
if (existsSync(outPath)) {
	console.error(`✗ ${outPath} already exists.`);
	process.exit(1);
}

// Creatures MUST declare Field Guide taxonomy (habitat + kind); scaffold valid defaults to EDIT, not
// TODO placeholders, so the stub parses as-is. See HABITATS/KINDS in scripts/content/lib/spec-schema.mjs.
const taxonomy = category === 'creatures' ? `habitat: [woodland]\nkind: mammal\n` : '';

const header = `---
content_kind: ${kind}
title: TODO Title
category: ${category}
slug: ${slug}
${taxonomy}tiers: [1, 2, 3]
default_tier: 2
summary: TODO one-sentence summary.
sources:
  - title: TODO source (public domain)
    license: Public domain
---
`;

const body =
	kind === 'verbatim'
		? `## all
TODO — paste the EXACT verbatim public-domain text here. It is byte-copied to every declared tier,
never adapted. For per-tier editions instead of one shared text, replace this "## all" block with
"## tier-1", "## tier-2", "## tier-3" blocks. No free text is allowed outside a block.
`
		: `TODO — paste the raw public-domain source text / research notes here. Pass A adapts this into
Tier 2 (Explorer); Passes B and C derive Tier 1 (Seedling) and Tier 3 (Scholar) from that.
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, header + '\n' + body);
console.log(`✓ Wrote ${outPath} (${kind}). Fill in the TODOs, then: pnpm content:gen ${outPath}`);
if (category === 'creatures') {
	console.log(
		'  ↳ creature: set its habitat[] + kind (Field Guide axes) — see spec-schema.mjs enums.'
	);
}
