// Ambient declaration for Pagefind's default search UI, which ships without types. This file has
// no top-level import/export so `declare module` is a true ambient declaration, not an augmentation.
declare module '@pagefind/default-ui' {
	export class PagefindUI {
		constructor(options: Record<string, unknown>);
	}
}
