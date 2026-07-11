import { describe, it, expect } from 'vitest';
import {
	groupByHabitat,
	groupByKind,
	presentHabitats,
	presentKinds,
	HABITAT_LABEL,
	KIND_LABEL
} from './axes';
import { HABITATS, KINDS } from '$lib/content';

// Minimal creature-like fixtures — only the fields the axis helpers read.
const fox = { habitat: ['woodland', 'farmland'] as const, kind: 'mammal' as const };
const owl = { habitat: ['woodland', 'sky'] as const, kind: 'bird' as const };
const trout = { habitat: ['river'] as const, kind: 'fish' as const };

describe('label maps cover every enum member', () => {
	it('has a label for each habitat and kind', () => {
		for (const h of HABITATS) expect(HABITAT_LABEL[h]).toBeTruthy();
		for (const k of KINDS) expect(KIND_LABEL[k]).toBeTruthy();
	});
});

describe('groupByHabitat', () => {
	it('groups in enum order, drops empty buckets, and repeats a multi-habitat creature', () => {
		const groups = groupByHabitat([fox, owl, trout]);
		// Enum order: woodland, river, sky, farmland — only the present ones, in that order.
		expect(groups.map((g) => g.value)).toEqual(['woodland', 'river', 'sky', 'farmland']);
		const woodland = groups.find((g) => g.value === 'woodland')!;
		expect(woodland.label).toBe('Woodland');
		expect(woodland.topics).toEqual([fox, owl]); // both live in woodland
	});

	it('returns nothing for an empty creature set', () => {
		expect(groupByHabitat([])).toEqual([]);
	});
});

describe('groupByKind', () => {
	it('groups in enum order, one bucket per kind, dropping empties', () => {
		const groups = groupByKind([fox, owl, trout]);
		expect(groups.map((g) => g.value)).toEqual(['mammal', 'bird', 'fish']);
		expect(groups.map((g) => g.label)).toEqual(['Mammals', 'Birds', 'Fish']);
		expect(groups.find((g) => g.value === 'mammal')!.topics).toEqual([fox]);
	});
});

describe('present axis values (drive axis-route entries + 404s)', () => {
	it('lists present habitats/kinds in enum order, deduped across creatures', () => {
		// fox: woodland+farmland, owl: woodland+sky, trout: river → woodland once, then river, sky, farmland.
		expect(presentHabitats([fox, owl, trout])).toEqual(['woodland', 'river', 'sky', 'farmland']);
		expect(presentKinds([fox, owl, trout])).toEqual(['mammal', 'bird', 'fish']);
	});

	it('is empty for an empty creature set (so no axis page is minted)', () => {
		expect(presentHabitats([])).toEqual([]);
		expect(presentKinds([])).toEqual([]);
	});
});
