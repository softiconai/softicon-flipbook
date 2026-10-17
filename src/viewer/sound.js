// A short paper swoosh made with Web Audio, so the plugin ships no sound file.
let ctx = null;
let noise = null;

const context = () => {
	const AudioCtx = window.AudioContext || window.webkitAudioContext;
	if (!AudioCtx) {
		return null;
	}
	if (!ctx) {
		ctx = new AudioCtx();
		noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
		const data = noise.getChannelData(0);
		for (let i = 0; i < data.length; i++) {
			data[i] = Math.random() * 2 - 1;
		}
	}
	return ctx;
};

export const playFlip = () => {
	const audio = context();
	if (!audio) {
		return;
	}
	if ('suspended' === audio.state) {
		audio.resume();
	}

	const now = audio.currentTime;
	const source = audio.createBufferSource();
	source.buffer = noise;

	const filter = audio.createBiquadFilter();
	filter.type = 'bandpass';
	filter.Q.value = 0.8;
	filter.frequency.setValueAtTime(2400, now);
	filter.frequency.exponentialRampToValueAtTime(500, now + 0.35);

	const gain = audio.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

	source.connect(filter).connect(gain).connect(audio.destination);
	source.start(now);
	source.stop(now + 0.4);
};
