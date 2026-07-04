// Root layout options — inherited by every route.

// Full prerendering is the deployment contract: adapter-static emits plain HTML/JS/CSS, which
// is all DreamHost shared hosting serves and all the Docker/nginx image needs. Any route that
// cannot prerender fails the build (adapter `strict: true`) — that is a feature, not a bug.
export const prerender = true;

// SSR must stay ON. With adapter-static, `ssr = false` prerenders empty shells — there would be
// no real HTML to serve offline and nothing for Pagefind to index. Do not disable this.
export const ssr = true;

// Directory-index URLs (`/library/` -> `/library/index.html`) — the cleanest form for nginx,
// Apache/DreamHost, and Cloudflare to serve without rewrite rules.
export const trailingSlash = 'always';
