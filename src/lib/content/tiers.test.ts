import { describe, it, expect } from 'vitest';
import { parseTierHash, resolveTier } from './tiers';

describe('parseTierHash', () => {
	it('parses the three app tier words', () => {
		expect(parseTierHash('#tier=seedling')).toBe('seedling');
		expect(parseTierHash('#tier=explorer')).toBe('explorer');
		expect(parseTierHash('#tier=scholar')).toBe('scholar');
	});

	it('is case-insensitive', () => {
		expect(parseTierHash('#tier=SCHOLAR')).toBe('scholar');
		expect(parseTierHash('#tier=Seedling')).toBe('seedling');
	});

	it('tolerates a missing leading # and extra params', () => {
		expect(parseTierHash('tier=explorer')).toBe('explorer');
		expect(parseTierHash('#tier=seedling&foo=bar')).toBe('seedling');
	});

	it('returns null for the numeric content-tier form (app words only)', () => {
		expect(parseTierHash('#tier=1')).toBeNull();
		expect(parseTierHash('#tier=3')).toBeNull();
	});

	it('returns null for anything unrecognised, empty, or absent', () => {
		expect(parseTierHash('#tier=bogus')).toBeNull();
		expect(parseTierHash('#other=seedling')).toBeNull();
		expect(parseTierHash('#tier=')).toBeNull();
		expect(parseTierHash('#')).toBeNull();
		expect(parseTierHash('')).toBeNull();
		expect(parseTierHash(null)).toBeNull();
		expect(parseTierHash(undefined)).toBeNull();
	});
});

describe('resolveTier', () => {
	it('returns the requested tier when available', () => {
		expect(resolveTier('2', ['1', '2', '3'])).toBe('2');
	});

	it('drops to the nearest lower tier when the requested one is missing', () => {
		expect(resolveTier('3', ['1', '2'])).toBe('2');
	});

	it('steps up to the nearest higher tier when the requested one is missing', () => {
		expect(resolveTier('1', ['2', '3'])).toBe('2');
	});

	it('falls back to the only authored tier', () => {
		expect(resolveTier('3', ['1'])).toBe('1');
	});
});
