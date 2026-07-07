import type { Category } from '$lib/content';

/** Reader-facing names + one-line blurbs for the three Library shelves. */
export const CATEGORY_LABEL: Record<Category, string> = {
	creatures: 'Creatures',
	faith: 'Faith',
	world: 'The World'
};

export const CATEGORY_BLURB: Record<Category, string> = {
	creatures: 'God’s living things — great and small.',
	faith: 'Saints, sacraments, and the life of the Church.',
	world: 'How the world is made, and the things people have done in it.'
};

/** The wallpaper-accent token each shelf uses for its kicker (all defined in tokens.css). */
export const CATEGORY_ACCENT: Record<Category, string> = {
	creatures: 'var(--green)',
	faith: 'var(--violet)',
	world: 'var(--blue)'
};

export const CATEGORY_ORDER: Category[] = ['creatures', 'faith', 'world'];
