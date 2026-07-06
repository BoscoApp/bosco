import { describe, it, expect } from 'vitest';
import { AV_COLORS, AV_EMBLEMS, avatarMarkup, defaultAvatar, randomAvatar } from './avatar';

describe('avatar generator', () => {
	it('builds markup from the chosen colour + emblem', () => {
		const markup = avatarMarkup({ color: 0, emblem: 0 });
		expect(markup).toContain(AV_COLORS[0]);
		expect(markup).toContain(AV_EMBLEMS[0]);
		expect(markup.startsWith('<rect')).toBe(true);
	});

	it('wraps out-of-range indices instead of throwing', () => {
		const markup = avatarMarkup({ color: -1, emblem: AV_EMBLEMS.length + 1 });
		expect(markup).toContain(AV_COLORS[AV_COLORS.length - 1]);
		expect(markup).toContain(AV_EMBLEMS[1]);
	});

	it('derives a stable default from a seed', () => {
		const a = defaultAvatar('profile-123');
		const b = defaultAvatar('profile-123');
		expect(a).toEqual(b);
		expect(a.color).toBeGreaterThanOrEqual(0);
		expect(a.color).toBeLessThan(AV_COLORS.length);
		expect(a.emblem).toBeLessThan(AV_EMBLEMS.length);
		expect(defaultAvatar('someone-else')).not.toEqual(a);
	});

	it('draws a fresh avatar from an injectable random source', () => {
		expect(randomAvatar(() => 0)).toEqual({ color: 0, emblem: 0 });
		expect(randomAvatar(() => 0.999)).toEqual({
			color: AV_COLORS.length - 1,
			emblem: AV_EMBLEMS.length - 1
		});
	});
});
