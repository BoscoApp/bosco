/**
 * Static metadata for the desktop's windows and the six "rooms". The rooms are placeholders in
 * v0.2.0 — their real content/UX arrives from v0.3.0 onward — so their copy lives here as data and
 * one <RoomBody> renders them all. Window bodies with real behaviour (Home, Settings, Who, About,
 * Help) are their own components.
 */

export interface WinDef {
	id: string;
	title: string;
	icon: string;
	/** Small windows are narrower; Home is the one large window. */
	small: boolean;
}

/** The six destinations, in dock order — each an app icon on the desktop. */
export interface DockApp {
	id: string;
	icon: string;
	label: string;
}

export const DOCK: DockApp[] = [
	{ id: 'win-library', icon: 'ic-library', label: 'The Library' },
	{ id: 'win-fieldguide', icon: 'ic-fieldguide', label: 'Field Guide' },
	{ id: 'win-chapel', icon: 'ic-chapel', label: 'The Chapel' },
	{ id: 'win-art', icon: 'ic-art', label: 'Art Studio' },
	{ id: 'win-arcade', icon: 'ic-arcade', label: 'The Arcade' },
	{ id: 'win-typing', icon: 'ic-typing', label: 'Typing' }
];

/** Every window's chrome metadata, keyed by id. */
export const WINDOWS: WinDef[] = [
	{ id: 'win-home', title: 'bosco.kids', icon: 'ic-home', small: false },
	{ id: 'win-settings', title: 'Settings', icon: 'ic-settings', small: true },
	{ id: 'win-who', title: 'Who’s exploring?', icon: 'ic-who', small: true },
	{ id: 'win-about', title: 'About Bosco', icon: 'ic-about', small: true },
	{ id: 'win-help', title: 'Help', icon: 'ic-help', small: true },
	{ id: 'win-library', title: 'The Library', icon: 'ic-library', small: false },
	{ id: 'win-fieldguide', title: 'The Field Guide', icon: 'ic-fieldguide', small: false },
	{ id: 'win-chapel', title: 'The Chapel', icon: 'ic-chapel', small: true },
	{ id: 'win-art', title: 'The Art Studio', icon: 'ic-art', small: true },
	{ id: 'win-arcade', title: 'The Arcade', icon: 'ic-arcade', small: true },
	{ id: 'win-typing', title: 'The Typing Trainer', icon: 'ic-typing', small: true }
];

export const WINDOW_BY_ID: Record<string, WinDef> = Object.fromEntries(
	WINDOWS.map((w) => [w.id, w])
);

/** The six Home tiles ("doors"). `accent` selects a kicker colour token in the CSS. */
export interface Door {
	id: string;
	icon: string;
	accent: 'blue' | 'green' | 'violet' | 'red' | 'gold' | 'teal';
	kicker: string;
	title: string;
	blurb: string;
}

export const DOORS: Door[] = [
	{
		id: 'win-library',
		icon: 'ic-library',
		accent: 'blue',
		kicker: 'Encyclopedia',
		title: 'The Library',
		blurb: 'Look up anything — saints, seas, stars, and how the world is made.'
	},
	{
		id: 'win-fieldguide',
		icon: 'ic-fieldguide',
		accent: 'green',
		kicker: 'Creature Guide',
		title: 'The Field Guide',
		blurb: 'Meet God’s creatures — browse them by habitat or by kind.'
	},
	{
		id: 'win-chapel',
		icon: 'ic-chapel',
		accent: 'violet',
		kicker: 'Kalendar · Prayers',
		title: 'The Chapel',
		blurb: 'Today’s feast, the day’s colour, and prayers to say aloud or quietly.'
	},
	{
		id: 'win-art',
		icon: 'ic-art',
		accent: 'red',
		kicker: 'Draw · Print',
		title: 'The Art Studio',
		blurb: 'Paint, colour saints and seasons, then print your work to hang up.'
	},
	{
		id: 'win-arcade',
		icon: 'ic-arcade',
		accent: 'gold',
		kicker: 'Little Games',
		title: 'The Arcade',
		blurb: 'Gentle puzzles and quick games — kind fun, and never any rush.'
	},
	{
		id: 'win-typing',
		icon: 'ic-typing',
		accent: 'teal',
		kicker: 'Prayers & Verses',
		title: 'The Typing Trainer',
		blurb: 'Learn the keys by typing prayers and Scripture — a little each day.'
	}
];

/** A placeholder room's content. */
export interface Room {
	id: string;
	icon: string;
	title: string;
	blurb: string;
	intro: string;
	items: string[];
	/** Chapel shows today's colour/season + a verse instead of an "opening soon" note. */
	kind: 'soon' | 'chapel';
	soon?: string;
}

// The Library (win-library) and Field Guide (win-fieldguide) are real destinations now — they render
// <LibraryBody> / <FieldGuideBody>, not placeholder rooms. The remaining four rooms stay placeholders
// until their own versions.
export const ROOMS: Record<string, Room> = {
	'win-chapel': {
		id: 'win-chapel',
		icon: 'ic-chapel',
		title: 'The Chapel',
		blurb: 'The Church’s calendar, her prayers, and her catechism.',
		intro: 'Here you keep the day with her.',
		items: [
			'The **1962 Kalendar** — today’s feast, its rank and colour.',
			'A **prayer book** — Latin and English, side by side.',
			'The **Baltimore Catechism** — graded to your reading level.'
		],
		kind: 'chapel'
	},
	'win-art': {
		id: 'win-art',
		icon: 'ic-art',
		title: 'The Art Studio',
		blurb: 'Draw, colour, and print your own pictures.',
		intro:
			'A friendly canvas with brushes, a fill bucket, stamps, and an undo you can trust. When you’re done — print it and hang it on the fridge.',
		items: [
			'Free draw, or colour a saint or a season.',
			'Save your work to **My Room**.',
			'Print button front and centre — paper is the point.'
		],
		kind: 'soon',
		soon: 'Mind the wet paint — opening in a later version.'
	},
	'win-arcade': {
		id: 'win-arcade',
		icon: 'ic-arcade',
		title: 'The Arcade',
		blurb: 'A couple of little games — kind fun, never any rush.',
		intro:
			'Two finished games to start, both quiet and gentle. Nothing here hurries you or asks you to come back.',
		items: [
			'**Typing Defense** — spell the falling words.',
			'**Saint & Symbol Match** — read the stained glass.',
			'High scores kept right here, just for you.'
		],
		kind: 'soon',
		soon: 'Inserting coin — opening in a later version.'
	},
	'win-typing': {
		id: 'win-typing',
		icon: 'ic-typing',
		title: 'The Typing Trainer',
		blurb: 'Learn the keys by typing prayers and Scripture.',
		intro:
			'Start on the home row and grow into whole passages — every lesson drawn from the prayers, verses, and creature-facts on this very site.',
		items: [
			'Gentle words-per-minute and accuracy — no timer breathing down your neck.',
			'Type the **Pater**, the **Ave**, a psalm.',
			'Your progress stays on this computer.'
		],
		kind: 'soon',
		soon: 'Warming up the keys — opening in a later version.'
	}
};
