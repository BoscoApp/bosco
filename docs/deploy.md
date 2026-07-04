# Deploy

CI builds once on a published, non-prerelease GitHub Release (`deploy.yml`) and ships two artifacts
from the same build (brief §5). Both are **skeleton** steps in Phase 0 — they no-op until enabled and
the secrets exist. The Phase 0 gate is offline `docker run`, not a public deploy.

## Artifact A — DreamHost (static files over SSH)

Enable with repo **variable** `DREAMHOST_ENABLED = true`, and set these repo **secrets**:

| Secret                  | What                                         |
| ----------------------- | -------------------------------------------- |
| `DREAMHOST_SSH_HOST`    | SSH host                                     |
| `DREAMHOST_SSH_USER`    | SSH user                                     |
| `DREAMHOST_SSH_KEY`     | private SSH key (key auth, not password)     |
| `DREAMHOST_DEPLOY_PATH` | absolute web-root path to sync `build/` into |

Then finish the `Deploy static files to DreamHost` step in `deploy.yml` (rsync over SSH). Prefer
upload-to-temp-then-swap, or omit `--delete` to avoid a bad run wiping the web root. Cloudflare sits
in front and can cache aggressively (every URL is a static, hashed file).

## Artifact B — multi-arch image to GHCR

Enable with repo **variable** `PUBLISH_IMAGE = true`. Auth uses the built-in `GITHUB_TOKEN` with
`packages: write` when publishing under the repo's own org; a PAT is only needed to push elsewhere.
The image is tagged `ghcr.io/<owner>/<repo>:<tag>` and `:latest`. (GHCR image names must be
lowercase.)

## Notes

- No secret values live in the repo — set them in repo Settings → Secrets/Variables.
- The deploy re-runs `check:offline` before shipping, so an offline-invariant regression blocks a
  release, not just a PR.
