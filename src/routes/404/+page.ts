// Prerendered (inherited from the root layout) but emitted as a flat top-level `404.html` instead
// of `404/index.html`, so nginx can serve it via `error_page 404 /404.html`. Overriding
// trailingSlash to 'never' for this one route is what produces the flat filename; the rest of the
// site keeps the directory-index form (`trailingSlash: 'always'`).
export const trailingSlash = 'never';
