// ObservanceId -> kid-friendly English display name for the 1962 calendar.
//
// introibo (Bosco's calendar source, CC0) emits Latin names only (lang=la). This map supplies
// English for the temporal cycle (every Sunday + the great feasts) and the major Class I & II
// sanctoral feasts. In the transform, an unmapped *feast/Sunday/octave* falls back to its Latin
// name; an unmapped plain *feria* falls back to "Feria — {season}". That makes this map double as
// the allowlist of which ferias (Ash Wednesday, Holy Week, the Ember Days, …) are distinctive
// enough to name at all.
//
// This is also the Library<->calendar join: a Faith article about a saint or feast maps to the
// same ObservanceId. Seeded here with the major cycle; extend as articles are authored.

const ORDINALS = [
	'',
	'First',
	'Second',
	'Third',
	'Fourth',
	'Fifth',
	'Sixth',
	'Seventh',
	'Eighth',
	'Ninth',
	'Tenth',
	'Eleventh',
	'Twelfth',
	'Thirteenth',
	'Fourteenth',
	'Fifteenth',
	'Sixteenth',
	'Seventeenth',
	'Eighteenth',
	'Nineteenth',
	'Twentieth',
	'Twenty-first',
	'Twenty-second',
	'Twenty-third',
	'Twenty-fourth'
];

const names: Record<string, string> = {
	// ---------- Advent ----------
	'roman:temporale:advent:sunday-1': 'First Sunday of Advent',
	'roman:temporale:advent:sunday-2': 'Second Sunday of Advent',
	'roman:temporale:advent:sunday-3': 'Third Sunday of Advent (Gaudete)',
	'roman:temporale:advent:sunday-4': 'Fourth Sunday of Advent',
	'roman:temporale:advent:quattuor-temporum:feria-4': 'Ember Wednesday of Advent',
	'roman:temporale:advent:quattuor-temporum:feria-6': 'Ember Friday of Advent',
	'roman:temporale:advent:quattuor-temporum:sabbatum': 'Ember Saturday of Advent',

	// ---------- Christmastide ----------
	'roman:temporale:christmas:vigil': 'Christmas Eve',
	'roman:temporale:christmas:nativity': 'Christmas Day',
	'roman:temporale:christmas:sunday-within-octave': 'Sunday within the Octave of Christmas',
	'roman:temporale:christmas:within-octave:day-5': 'Fifth Day in the Octave of Christmas',
	'roman:temporale:christmas:within-octave:day-6': 'Sixth Day in the Octave of Christmas',
	'roman:temporale:christmas:within-octave:day-7': 'Seventh Day in the Octave of Christmas',
	'roman:temporale:christmas:octave-day': 'The Circumcision of Our Lord',
	'roman:temporale:christmas:holy-name': 'The Holy Name of Jesus',

	// ---------- Time after Epiphany ----------
	'roman:temporale:epiphany:domini': 'The Epiphany',
	'roman:temporale:epiphany:holy-family': 'The Holy Family',

	// ---------- Septuagesima (pre-Lent) ----------
	'roman:temporale:paschal:septuagesima': 'Septuagesima Sunday',
	'roman:temporale:paschal:sexagesima': 'Sexagesima Sunday',
	'roman:temporale:paschal:quinquagesima': 'Quinquagesima Sunday',

	// ---------- Lent ----------
	'roman:temporale:paschal:ash-wednesday': 'Ash Wednesday',
	'roman:temporale:paschal:post-cineres:feria-5': 'Thursday after Ash Wednesday',
	'roman:temporale:paschal:post-cineres:feria-6': 'Friday after Ash Wednesday',
	'roman:temporale:paschal:post-cineres:sabbatum': 'Saturday after Ash Wednesday',
	'roman:temporale:paschal:lent-1': 'First Sunday of Lent',
	'roman:temporale:paschal:lent-2': 'Second Sunday of Lent',
	'roman:temporale:paschal:lent-3': 'Third Sunday of Lent',
	'roman:temporale:paschal:lent-4': 'Fourth Sunday of Lent (Laetare)',
	'roman:temporale:paschal:quattuor-temporum-quadragesimae:feria-4': 'Ember Wednesday of Lent',
	'roman:temporale:paschal:quattuor-temporum-quadragesimae:feria-6': 'Ember Friday of Lent',
	'roman:temporale:paschal:quattuor-temporum-quadragesimae:sabbatum': 'Ember Saturday of Lent',

	// ---------- Passiontide ----------
	'roman:temporale:paschal:passion-sunday': 'Passion Sunday',
	'roman:temporale:paschal:palm-sunday': 'Palm Sunday',
	'roman:temporale:paschal:holy-week:feria-2': 'Monday of Holy Week',
	'roman:temporale:paschal:holy-week:feria-3': 'Tuesday of Holy Week',
	'roman:temporale:paschal:holy-week:feria-4': 'Wednesday of Holy Week',
	'roman:temporale:paschal:maundy-thursday': 'Maundy Thursday',
	'roman:temporale:paschal:good-friday': 'Good Friday',
	'roman:temporale:paschal:holy-saturday': 'Holy Saturday',

	// ---------- Eastertide (Paschaltide) ----------
	'roman:temporale:paschal:easter': 'Easter Sunday',
	'roman:temporale:paschal:easter-octave:feria-2': 'Easter Monday',
	'roman:temporale:paschal:easter-octave:feria-3': 'Easter Tuesday',
	'roman:temporale:paschal:easter-octave:feria-4': 'Easter Wednesday',
	'roman:temporale:paschal:easter-octave:feria-5': 'Easter Thursday',
	'roman:temporale:paschal:easter-octave:feria-6': 'Easter Friday',
	'roman:temporale:paschal:easter-octave:sabbatum': 'Easter Saturday',
	'roman:temporale:paschal:low-sunday': 'Low Sunday',
	'roman:temporale:paschal:rogation:feria-2': 'Rogation Monday',
	'roman:temporale:paschal:rogation:feria-3': 'Rogation Tuesday',
	'roman:temporale:paschal:rogation:feria-4': 'Rogation Wednesday',
	'roman:temporale:paschal:ascension': 'The Ascension',
	'roman:temporale:paschal:sunday-after-ascension': 'Sunday after the Ascension',
	'roman:temporale:paschal:pentecost-vigil': 'Vigil of Pentecost',
	'roman:temporale:paschal:pentecost': 'Pentecost Sunday',
	'roman:temporale:paschal:pentecost-octave:feria-2': 'Whit Monday',
	'roman:temporale:paschal:pentecost-octave:feria-3': 'Whit Tuesday',
	'roman:temporale:paschal:pentecost-octave:feria-5': 'Whit Thursday',
	'roman:temporale:paschal:pentecost-octave:quattuor-temporum:feria-4':
		'Ember Wednesday in Whitsun Week',
	'roman:temporale:paschal:pentecost-octave:quattuor-temporum:feria-6':
		'Ember Friday in Whitsun Week',
	'roman:temporale:paschal:pentecost-octave:quattuor-temporum:sabbatum':
		'Ember Saturday in Whitsun Week',

	// ---------- Time after Pentecost ----------
	'roman:temporale:paschal:trinity-sunday': 'Trinity Sunday',
	'roman:temporale:paschal:corpus-christi': 'Corpus Christi',
	'roman:temporale:paschal:sacred-heart': 'The Sacred Heart of Jesus',
	'roman:temporale:paschal:pentecost-time:sunday-ultima': 'Last Sunday after Pentecost',
	'roman:temporale:month-computed:christ-the-king': 'The Feast of Christ the King',

	// ---------- Major sanctoral feasts (Class I & II) ----------
	'roman:sanctorale:ioannes-bosco': 'Saint John Bosco', // Bosco's patron and namesake
	'roman:sanctorale:baptisma-domini': 'The Baptism of Our Lord',
	'roman:sanctorale:purificatio': 'The Purification (Candlemas)',
	'roman:sanctorale:matthias': 'Saint Matthias the Apostle',
	'roman:sanctorale:ioseph': 'Saint Joseph',
	'roman:sanctorale:annuntiatio': 'The Annunciation',
	'roman:sanctorale:marcus': 'Saint Mark the Evangelist',
	'roman:sanctorale:philippus-iacobus': 'Saints Philip and James',
	'roman:sanctorale:ioseph-opifex': 'Saint Joseph the Worker',
	'roman:sanctorale:ioannes-baptista:vigilia': 'Vigil of Saint John the Baptist',
	'roman:sanctorale:nativitas-ioannis-baptistae': 'The Nativity of Saint John the Baptist',
	'roman:sanctorale:petrus-paulus': 'Saints Peter and Paul',
	'roman:sanctorale:visitatio': 'The Visitation',
	'roman:sanctorale:pretiosissimi-sanguinis': 'The Most Precious Blood',
	'roman:sanctorale:iacobus': 'Saint James the Apostle',
	'roman:sanctorale:transfiguratio-domini': 'The Transfiguration',
	'roman:sanctorale:laurentius': 'Saint Lawrence',
	'roman:sanctorale:assumptio:vigilia': 'Vigil of the Assumption',
	'roman:sanctorale:assumptio': 'The Assumption',
	'roman:sanctorale:immaculatum-cor-mariae': 'The Immaculate Heart of Mary',
	'roman:sanctorale:bartholomaeus': 'Saint Bartholomew the Apostle',
	'roman:sanctorale:nativitas-mariae': 'The Nativity of the Blessed Virgin Mary',
	'roman:sanctorale:exaltatio-crucis': 'The Exaltation of the Holy Cross',
	'roman:sanctorale:septem-dolorum-bmv': 'The Seven Sorrows of the Blessed Virgin Mary',
	'roman:sanctorale:matthaeus': 'Saint Matthew the Apostle',
	'roman:sanctorale:michael-archangelus': 'Saint Michael the Archangel',
	'roman:sanctorale:rosarium': 'Our Lady of the Rosary',
	'roman:sanctorale:simon-et-iudas': 'Saints Simon and Jude',
	'roman:sanctorale:omnes-sancti': 'All Saints',
	'roman:sanctorale:omnium-sanctorum': 'All Saints',
	'roman:sanctorale:dedicatio-basilicae-salvatoris':
		'Dedication of the Basilica of the Holy Saviour',
	'roman:sanctorale:andreas': 'Saint Andrew the Apostle',
	'roman:sanctorale:immaculata-conceptio': 'The Immaculate Conception',
	'roman:sanctorale:thomas-apostolus': 'Saint Thomas the Apostle',
	'roman:sanctorale:stephanus': 'Saint Stephen',
	'roman:sanctorale:innocentes': 'The Holy Innocents'
};

// Numbered Sunday series — filled programmatically to keep the map compact and consistent.
for (let n = 2; n <= 6; n++) {
	names[`roman:temporale:epiphany:sunday-${n}`] = `${ORDINALS[n]} Sunday after Epiphany`;
}
for (let n = 2; n <= 5; n++) {
	names[`roman:temporale:paschal:paschaltide:sunday-${n}`] = `${ORDINALS[n]} Sunday after Easter`;
}
for (let n = 2; n <= 24; n++) {
	names[`roman:temporale:paschal:pentecost-time:sunday-${n}`] =
		`${ORDINALS[n]} Sunday after Pentecost`;
}
for (let n = 4; n <= 6; n++) {
	names[`roman:temporale:paschal:pentecost-time:resumed-epiphany-${n}`] =
		`${ORDINALS[n]} Resumed Sunday after Epiphany`;
}

export const ENGLISH_NAMES: Record<string, string> = names;

/**
 * English display name for an ObservanceId. Returns the mapped English name if known, otherwise the
 * supplied Latin fallback (introibo's `names.la`), otherwise null. Ferias pass `null` as the
 * fallback so unnamed ferias resolve to the reader's "Feria — {season}" label.
 */
export function englishName(
	id: string | undefined | null,
	fallbackLatin: string | undefined | null
): string | null {
	if (id) {
		const hit = names[id];
		if (hit !== undefined) return hit;
	}
	return fallbackLatin ?? null;
}
