/**
 * The desktop's in-window anchor intercept — shared by the Library and Field Guide windows.
 *
 * Views inside those windows link with REAL `<a href>`s to the canonical prerendered routes, so deep
 * links, middle-click, ⌘/ctrl-click, and no-JS all work. This turns a plain left-click on a same-origin
 * link the window CLAIMS into an in-window store move instead — leaving every other window mounted (a
 * `goto` would tear the whole desktop down). Modified/middle clicks, cross-origin links, and links the
 * window doesn't claim fall through to the browser's normal navigation.
 *
 * Attach the returned handler with `onclickcapture`. Each window passes its own `navigate`, which parses
 * the clicked link's pathname and returns `true` iff it claimed and handled it (the real navigation is
 * then prevented).
 *
 * @param navigate Given the clicked link's pathname, perform the in-window move and return `true`; return
 *   `false` to let the browser navigate normally.
 */
export function anchorIntercept(navigate: (pathname: string) => boolean) {
	return (e: MouseEvent) => {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
			return;
		}
		const a = (e.target as HTMLElement).closest('a');
		if (!a || !a.getAttribute('href')) return;
		const url = new URL(a.href, location.href);
		if (url.origin !== location.origin) return;
		if (navigate(url.pathname)) e.preventDefault();
	};
}
