#!/usr/bin/env node
/**
 * The doctrinal reviewer's worklist: every committed topic the production gate would EXCLUDE
 * (review_status !== approved), with its kind, tiers, sources, and — for doctrine — the paths to open
 * and read. It changes nothing; approving is the owner editing review_status to `approved`.
 *
 *   pnpm content:review              # pending/draft topics
 *   pnpm content:review --all        # include approved
 *   pnpm content:review --kind=verbatim   # triage doctrine first
 *   pnpm content:review --json       # machine-readable (for a future preview UI)
 */
import { parseArgs } from 'node:util';
import { scanReviewTopics, formatReviewQueue } from './lib/review.mjs';

const CONTENT_ROOT = 'src/content';

const { values } = parseArgs({
	options: {
		all: { type: 'boolean' },
		kind: { type: 'string' },
		json: { type: 'boolean' },
		paths: { type: 'boolean' },
		out: { type: 'string' }
	}
});

const topics = scanReviewTopics(values.out ?? CONTENT_ROOT);

if (values.json) {
	let rows = values.all ? topics : topics.filter((t) => t.status !== 'approved');
	if (values.kind) rows = rows.filter((t) => t.kind === values.kind);
	console.log(JSON.stringify(rows, null, 2));
} else {
	console.log(
		formatReviewQueue(topics, {
			all: Boolean(values.all),
			kind: values.kind,
			showPaths: Boolean(values.paths)
		})
	);
}
