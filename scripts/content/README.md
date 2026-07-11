# The content pipeline (authoring-time tooling)

Manual, out-of-band tooling for authoring Library topics — the same posture as `scripts/calendar/`:
**you** run it on your machine, it writes committed files, and CI only ever _reads_ the result. Nothing
here is imported by the app (`src/**`), runs in CI (except the pure `guard:provenance` reader), or adds a
runtime dependency. The runtime offline invariant is untouched.

## What it does

Turns one **spec** (`scripts/content/specs/<category>/<slug>.topic.md`) into a topic folder under
`src/content/<category>/<slug>/` — `index.md` (born `review_status: pending`) + `tier-1/2/3.md` +
a `provenance.json` sidecar — in the exact shape the content plugin renders.

- **Adapted** topics (stories/facts) run three passes: **A** adapts the source → Tier 2 (Explorer),
  then **B** derives Tier 1 (Seedling) and **C** derives Tier 3 (Scholar) from the Tier-2 body.
- **Verbatim** topics (doctrine — prayers, the Baltimore Catechism, Scripture, creeds) are **byte-copied**,
  never adapted. Their spec body is a label-only `## tier-N` / `## all` block: there is no free text a
  pass could rewrite, and the verbatim code path takes no generator, so adapting doctrine is a code path
  that does not exist.

## The commands

```sh
# Scaffold a spec (writes the correct adapted or verbatim stub)
pnpm content:new creatures/red-fox --kind=adapted
pnpm content:new faith/hail-mary  --kind=verbatim

# Generate the topic. Default = the OFFLINE FAKE generator (placeholder prose).
pnpm content:gen scripts/content/specs/creatures/red-fox.topic.md

# Generate with the REAL model (the only networked step; needs a key you never commit):
ANTHROPIC_API_KEY=sk-… pnpm content:gen <spec> --generator=claude --model=claude-opus-4-8

# Your review worklist — every topic the production gate excludes, doctrine badged:
pnpm content:review
pnpm content:review --kind=verbatim     # triage doctrine first

# Regenerate the CREDITS "## Content" index from the sidecars (advisory; not a CI gate):
pnpm credits:content
```

Set `BOSCO_GENERATOR=claude` / `BOSCO_MODEL=…` to change the defaults. **Consult the `claude-api` skill
for the current model id** before wiring the real adapter.

## The fake generator is not shippable prose

The default generator is a deterministic, offline stand-in so the machinery is fully testable with no
network and no key. Its output is obvious placeholder text carrying a sentinel. **Regenerate a
fake-drafted topic with the real adapter (or hand-write the tiers) before you approve it.** Two guards
make "approve the filler" fail structurally: `guard:provenance` fails on a `fake`-generated tier that
reaches `approved`, and the production build gate greps the sentinel out of shipped output.

## Approving content

Nothing the tool emits is ever pre-approved — every topic is born `review_status: pending` and is
excluded from production builds. **You** are the doctrinal reviewer: read the prose (for doctrine, read
the actual verbatim bytes — `content:review` prints the tier-file paths), then change `review_status` to
`approved` in the topic's `index.md`. The tool never does this for you.

## What `guard:provenance` proves — and what it does not

`pnpm guard:provenance` (in CI) enforces, over committed source:

- every `faith/**` topic has a `provenance.json` (doctrine cannot dodge the tool into production);
- any path the `doctrine-registry.json` marks must be `verbatim` — an adapted one fails;
- a verbatim topic whose any tier was produced by a pass fails;
- a verbatim tier whose on-disk bytes no longer match its recorded SHA-256 fails (frozen doctrine can't
  be hand-edited after emit — correct it by re-running the spec, not by patching `tier-N.md`);
- an `approved` topic with a fake-generated tier fails.

**Precise guarantee:** this proves the adaptation passes never ran over verbatim material, and that frozen
doctrine is untampered since emit. It does **not** prove _doctrinal fidelity_ — that the verbatim bytes are
the true text. A hash can't decide that; your review is what does. (A future step could vendor canonical
public-domain editions and map verbatim tiers from them by reference, making fidelity checkable too.)

## Keep the doctrine registry current

`doctrine-registry.json` lists paths that MUST be verbatim. It is the _second_ check; the load-bearing
structural gate is the mandatory-`provenance.json`-for-all-`faith/**` rule above. Add new doctrine
classes/slugs to the registry as you author them.
