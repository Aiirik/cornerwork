import { pathToFileURL } from 'node:url';

const calls = [];

class FakePort {
  set onmessage(handler) {
    this.handler = handler;
    queueMicrotask(() =>
      handler({
        data: [
          'ready',
          { configure: 1, latency: 0, stop: 1, start: 5, addBuffers: 1, dropBuffers: 1 },
        ],
      }),
    );
  }

  postMessage(data, transfer) {
    const [id, method, ...args] = data;
    calls.push({ method, args, transferred: transfer?.length || 0 });
    queueMicrotask(() => this.handler({ data: [id, method === 'latency' ? 0.01 : null] }));
  }
}

globalThis.AudioWorkletNode = class {
  constructor() {
    this.port = new FakePort();
  }

  connect() {}
};

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
await new Promise((resolve) => setTimeout(resolve, 150));
if (cancelledCallbackRan) throw new Error('A cancelled bundled callout completed its callback');

await new Promise((resolve) => engine.speak('1 2', { rate: 1.485, onend: resolve }));
await engine.speak('unknown line');

const start = calls.findLast((call) => call.method === 'start'),
  addBuffers = calls.findLast((call) => call.method === 'addBuffers'),
  expectedTempo = 1.485 / manifest.generationSpeed;
if (!start || Math.abs(start.args[3] - expectedTempo) > 0.0001)
  throw new Error('Bundled tempo was not sent to the time stretcher');
if (start.args[4] !== 0) throw new Error('Bundled pitch must remain at zero semitones');
if (addBuffers?.transferred !== 1)
  throw new Error('Bundled samples were not transferred efficiently');
if (fallbackText !== 'unknown line') throw new Error('Unknown lines must use device fallback');

console.log('Validated pitch-preserving tempo, cancellation, completion, and device fallback.');
