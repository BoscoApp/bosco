/**
 * Avatar generator — a child's picture is a colour swatch + a Christian emblem, each an index
 * into these sets (so it persists as two small numbers on the profile). The SVG is assembled as
 * a string and rendered with {@html}; the colours are identity colours, deliberately independent
 * of the liturgical theme. See issue #70.
 */
import type { ProfileAvatar } from '$lib/state';

/** Identity swatches — the app's brand hues plus one deep magenta. */
export const AV_COLORS = [
	'#3f8f4a',
	'#2e5aa8',
	'#d1483a',
	'#7a5aa8',
	'#e0a531',
	'#2b8f8f',
	'#8a1c7b'
] as const;

/** Emblems: star · fish (ichthys) · dove · sun · lamb · heart. Drawn white, on the swatch. */
export const AV_EMBLEMS = [
	'<path d="M22 10 l3.3 6.8 7.5 1.1 -5.4 5.3 1.3 7.4 -6.7 -3.5 -6.7 3.5 1.3 -7.4 -5.4 -5.3 7.5 -1.1z" fill="#fff"/>',
	'<path d="M11 22 q11 -9 21 0 q-11 9 -21 0z" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M30 22 l6 -4 v8z" fill="#fff"/>',
	'<path d="M13 25 q3 -10 14 -9 q-3 3 -2 6 q5 -1 8 2 q-7 5 -13 3 q-5 -1 -7 -2z" fill="#fff"/>',
	'<circle cx="22" cy="22" r="7" fill="#fff"/><g stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M22 6v4M22 34v4M6 22h4M34 22h4M11 11l3 3M30 30l3 3M33 11l-3 3M14 30l-3 3"/></g>',
	'<circle cx="22" cy="25" r="9" fill="#fff"/><circle cx="22" cy="18" r="5.4" fill="#fff"/><circle cx="16" cy="16" r="2.6" fill="#fff"/><circle cx="28" cy="16" r="2.6" fill="#fff"/>',
	'<path d="M22 33 C9 24 12 13 18 13 c3 0 4 2.4 4 3.6 c0 -1.2 1 -3.6 4 -3.6 c6 0 9 11 -4 20z" fill="#fff"/>'
] as const;

export const EMBLEM_NAMES = ['Star', 'Fish', 'Dove', 'Sun', 'Lamb', 'Heart'] as const;

const wrap = (n: number, len: number) => ((n % len) + len) % len;

/** Inner SVG markup (a rounded swatch + the emblem) for a 44×44 viewBox. */
export function avatarMarkup(avatar: ProfileAvatar): string {
	const color = AV_COLORS[wrap(avatar.color, AV_COLORS.length)];
	const emblem = AV_EMBLEMS[wrap(avatar.emblem, AV_EMBLEMS.length)];
	return `<rect width="44" height="44" rx="12" fill="${color}"/>${emblem}`;
}

/** A stable default avatar derived from a string (a profile id/name) — used when none was chosen. */
export function defaultAvatar(seed: string): ProfileAvatar {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
	h = Math.abs(h);
	return { color: h % AV_COLORS.length, emblem: (h >> 3) % AV_EMBLEMS.length };
}

/** A fresh random avatar (the "Shuffle" button). Callers pass a random source for testability. */
export function randomAvatar(rnd: () => number = Math.random): ProfileAvatar {
	return {
		color: Math.floor(rnd() * AV_COLORS.length),
		emblem: Math.floor(rnd() * AV_EMBLEMS.length)
	};
}
