import { pathToFileURL } from 'node:url';

const calls = [],
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

const context = {
    state: 'running',
    currentTime: 1,
    destination: {},
    resume: async () => {},
    decodeAudioData: async () => ({ sampleRate: 24000 }),
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
await engine.speak('unknown line');

const expectedRate = 1.485 / manifest.generationSpeed,
  starts = calls.filter((call) => call.method === 'start');
if (!starts.length || starts.some((call) => Math.abs(call.rate - expectedRate) > 0.0001))
  throw new Error('Bundled playback rate was not applied');
if (fallbackText !== 'unknown line') throw new Error('Unknown lines must use device fallback');

console.log('Validated reliable bundled playback, cancellation, completion, and device fallback.');
