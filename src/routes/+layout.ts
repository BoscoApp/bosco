// Every route in Bosco is prerendered to a static file. Combined with
// `adapter-static` `strict: true`, a route that cannot be prerendered fails the
// build — this is how the offline invariant is enforced at the framework level.
export const prerender = true;

// Static hosting serves clean directory URLs; keep trailing slashes consistent so
// relative asset paths resolve identically from any depth.
export const trailingSlash = 'always';
