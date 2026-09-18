import { pathToFileURL } from 'node:url';

const calls = [],
  mediaStarts = [],
  activeSources = new Set();

class FakeSource {
  constructor() {
    this.playbackRate = { value: 1 };
  }

  connect() {}

  start(when, offset, duration) {
    calls.push({ method: 'start', when, offset, duration, rate: this.playbackRate.value });
    activeSources.add(this);
    this.timer = setTimeout(() => {
      activeSources.delete(this);
      this.onended?.();
    }, 20);
  }

  stop() {
    clearTimeout(this.timer);
    activeSources.delete(this);
    queueMicrotask(() => this.onended?.());
  }
}

class FakeMedia {
  constructor() {
    this.paused = true;
    this.src = '';
  }

  play() {
    this.paused = false;
    if (!this.src.startsWith('data:')) {
      mediaStarts.push({
        rate: this.playbackRate,
        preservesPitch: this.preservesPitch,
        webkitPreservesPitch: this.webkitPreservesPitch,
      });
      this.timer = setTimeout(() => {
        this.paused = true;
        this.onended?.();
      }, 20);
    }
    return Promise.resolve();
  }

  pause() {
    clearTimeout(this.timer);
    this.paused = true;
  }

  removeAttribute(name) {
    if (name === 'src') this.src = '';
  }

  load() {}
}

class RejectingMedia extends FakeMedia {
  play() {
    return Promise.reject(new Error('Media playback unavailable'));
  }
}

const manifest = {
  generationSpeed: 1.2,
  lines: [
    { id: 'one', key: '1', text: '1' },
    { id: 'two', key: '2', text: '2' },
  ],
  voices: [
    {
      id: 'bella',
      file: 'bella.opus',
      clips: {
        one: { start: 0, duration: 0.02 },
        two: { start: 0.02, duration: 0.02 },
      },
    },
  ],
};

globalThis.fetch = async (url) => ({
  ok: true,
  status: 200,
  json: async () => manifest,
  arrayBuffer: async () => new ArrayBuffer(url.includes('bella') ? 8 : 0),
});

const channel = new Float32Array(2000);
channel.fill(0.25);
const context = {
    state: 'running',
    currentTime: 1,
    destination: {},
    resume: async () => {},
    decodeAudioData: async () => ({ sampleRate: 24000, getChannelData: () => channel }),
    createGain: () => ({ gain: { value: 0 }, connect() {} }),
    createBufferSource: () => new FakeSource(),
  },
  { createVoiceEngine } = await import(
    pathToFileURL(`${process.cwd()}/dist/assets/js/voice-engine.js`)
  );

let fallbackText = '',
  cancelledCallbackRan = false;
const engine = createVoiceEngine({
  getContext: () => context,
  getVolume: () => 80,
  getVoiceId: () => 'bella',
  fallback: (text) => (fallbackText = text),
  createMediaElement: () => new FakeMedia(),
});

await engine.prepare();
await engine.speak('1 2', {
  rate: 1.485,
  onend: () => (cancelledCallbackRan = true),
});
engine.cancel();
await new Promise((resolve) => setTimeout(resolve, 40));
if (cancelledCallbackRan) throw new Error('A cancelled bundled callout completed its callback');
if (activeSources.size) throw new Error('Cancelled bundled sources must be stopped');

await new Promise((resolve) => engine.speak('1 2', { rate: 1.485, onend: resolve }));
await new Promise((resolve) => engine.speak('1', { onend: resolve }));
await engine.speak('unknown line');

const fallbackEngine = createVoiceEngine({
  getContext: () => context,
  getVolume: () => 80,
  getVoiceId: () => 'bella',
  fallback: () => {},
  createMediaElement: () => new RejectingMedia(),
});
await new Promise((resolve) => fallbackEngine.speak('1', { rate: 1.485, onend: resolve }));

const expectedRate = 1.485 / manifest.generationSpeed,
  starts = calls.filter((call) => call.method === 'start'),
  naturalStart = starts.at(-2),
  fallbackStart = starts.at(-1);
if (!mediaStarts.length || mediaStarts.some((call) => Math.abs(call.rate - expectedRate) > 0.0001))
  throw new Error('Bundled tempo was not applied through pitch-preserving playback');
if (mediaStarts.some((call) => !call.preservesPitch || !call.webkitPreservesPitch))
  throw new Error('Bundled tempo changes must preserve pitch');
if (!naturalStart || naturalStart.rate !== 1)
  throw new Error('Bundled announcements must use the recording speed');
if (!fallbackStart || Math.abs(fallbackStart.rate - expectedRate) > 0.0001)
  throw new Error('Pitch-preserving media failures must fall back to Web Audio');
if (fallbackText !== 'unknown line') throw new Error('Unknown lines must use device fallback');

console.log('Validated reliable bundled playback, cancellation, completion, and device fallback.');
