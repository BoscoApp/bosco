import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_DOMAIN } from './meta';

describe('app meta', () => {
	it('names the app', () => {
		expect(APP_NAME).toBe('Bosco');
	});

	it('pins the domain', () => {
		expect(APP_DOMAIN).toBe('bosco.kids');
	});
});
