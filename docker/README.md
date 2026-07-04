# Docker — the guaranteed-offline story

One multi-stage image: build the static site with Node, serve it with nginx. The payload is plain
static files, so it's architecture-agnostic and the multi-arch (amd64 + arm64) build is nearly free.

## Build and run offline

```sh
docker build -t bosco:local .
docker run --rm --network none -p 8080:80 bosco:local
# open http://localhost:8080
```

`--network none` proves the Phase 0 **Done-when** gate: the styled Portal serves, navigation works,
and the reading-level switch works, all with networking disabled. Nothing phones home because there
is nothing to phone home to — every asset is bundled and the external-URL guardrail fails the build
if that ever stops being true.

## Multi-arch (CI)

`deploy.yml` builds `linux/amd64,linux/arm64` via `docker buildx` + QEMU and pushes to GHCR when
`vars.PUBLISH_IMAGE == 'true'`. The arm64 path keeps the future Raspberry Pi option free. Because the
static output is arch-independent, only the nginx base differs per arch.

## nginx

`docker/nginx.conf` serves the directory-index pages emitted by adapter-static
(`trailingSlash: 'always'` → `route/index.html`): `try_files $uri $uri/index.html $uri.html =404`,
long-cache for immutable hashed assets, no-cache for HTML, `gzip_static on` for the precompressed
siblings. No upstream, no dynamic layer.
