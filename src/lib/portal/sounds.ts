/**
 * Gentle sounds — soft chimes on window open/close, synthesized with the Web Audio API so there
 * are no audio files to fetch (stays fully offline). Gated behind the Sounds preference. Every
 * entry point is browser- and error-safe: on the server, or if audio is blocked, calls no-op.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
	enabled = on;
}

function audioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	try {
		if (!ctx) {
			const Ctor =
				window.AudioContext ??
				(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!Ctor) return null;
			ctx = new Ctor();
		}
		if (ctx.state === 'suspended') void ctx.resume();
		return ctx;
	} catch {
		return null;
	}
}

/** Play a short arpeggio of sine tones. Used only through the named `sounds` below. */
function tone(freqs: number[], dur: number, vol: number): void {
	if (!enabled) return;
	const c = audioContext();
	if (!c) return;
	const t0 = c.currentTime;
	freqs.forEach((f, i) => {
		const osc = c.createOscillator();
		const gain = c.createGain();
		osc.type = 'sine';
		osc.frequency.value = f;
		const start = t0 + i * 0.05;
		gain.gain.setValueAtTime(0.0001, start);
		gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
		osc.connect(gain);
		gain.connect(c.destination);
		osc.start(start);
		osc.stop(start + dur + 0.02);
	});
}

export const sounds = {
	open: () => tone([523.25, 783.99], 0.16, 0.05),
	close: () => tone([392.0, 261.63], 0.14, 0.045),
	tick: () => tone([660], 0.05, 0.03)
};
