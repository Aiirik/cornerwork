import SignalsmithStretch from './vendor/signalsmith-stretch.mjs';

SignalsmithStretch.moduleUrl = new URL('./vendor/signalsmith-stretch.mjs', import.meta.url).href;

const normalize = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/\bsecs?\b/g, 'seconds')
    .replace(/[·–—-]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function createVoiceEngine({ getContext, getVolume, getVoiceId, fallback }) {
  let manifestPromise,
    generation = 0,
    stretchContext = null,
    stretchPromise = null,
    endTimer = null;
  const buffers = new Map();

  const manifest = () =>
    (manifestPromise ||= fetch('./assets/voices/manifest.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Voice manifest failed: ${response.status}`);
        return response.json();
      })
      .catch((error) => {
        manifestPromise = null;
        throw error;
      }));

  async function bufferFor(voice) {
    if (buffers.has(voice.id)) return buffers.get(voice.id);
    const promise = fetch(`./assets/voices/${voice.file}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Voice pack failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((data) => {
        const context = getContext();
        if (!context) throw new Error('Web Audio is unavailable');
        return context.decodeAudioData(data);
      })
      .catch((error) => {
        buffers.delete(voice.id);
        throw error;
      });
    buffers.set(voice.id, promise);
    return promise;
  }

  function stretchFor(context) {
    if (stretchPromise && stretchContext === context) return stretchPromise;
    stretchContext = context;
    stretchPromise = SignalsmithStretch(context, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
    })
      .then(async (node) => {
        const gain = context.createGain();
        gain.gain.value = clamp(getVolume() / 100, 0, 1);
        node.connect(gain);
        gain.connect(context.destination);
        await node.configure({ preset: 'default', splitComputation: true });
        return { node, gain };
      })
      .catch((error) => {
        if (stretchContext === context) {
          stretchContext = null;
          stretchPromise = null;
        }
        throw error;
      });
    return stretchPromise;
  }

  function combineClips(audioBuffer, voice, clips, playbackRate) {
    const channel = audioBuffer.getChannelData(0),
      sampleRate = audioBuffer.sampleRate,
      pieces = clips.map(({ line, gap }) => {
        const clip = voice.clips[line.id];
        if (!clip) throw new Error(`Missing bundled clip: ${line.key}`);
        const start = clamp(Math.round(clip.start * sampleRate), 0, channel.length),
          end = clamp(Math.round((clip.start + clip.duration) * sampleRate), start, channel.length),
          silence = Math.max(0, Math.round(gap * playbackRate * sampleRate));
        return { start, end, silence };
      }),
      totalSamples = pieces.reduce(
        (total, piece) => total + piece.end - piece.start + piece.silence,
        0,
      ),
      samples = new Float32Array(totalSamples);
    let offset = 0;
    pieces.forEach(({ start, end, silence }) => {
      samples.set(channel.subarray(start, end), offset);
      offset += end - start + silence;
    });
    return samples;
  }

  function resolveText(data, text) {
    const byKey = new Map(data.lines.map((line) => [line.key, line])),
      exact = byKey.get(normalize(text));
    if (exact) return [{ line: exact, gap: 0 }];

    const candidates = data.lines
        .map((line) => ({ line, words: line.key.split(' ') }))
        .sort((a, b) => b.words.length - a.words.length),
      parts = String(text)
        .split(/[.!?]+/)
        .map(normalize)
        .filter(Boolean),
      result = [];

    for (const part of parts) {
      const whole = byKey.get(part);
      if (whole) {
        result.push({ line: whole, gap: 0.11 });
        continue;
      }
      const words = part.split(' ');
      for (let index = 0; index < words.length; ) {
        const match = candidates.find(
          (candidate) =>
            candidate.words.length <= words.length - index &&
            candidate.words.every((word, offset) => words[index + offset] === word),
        );
        if (match) {
          result.push({ line: match.line, gap: 0.035 });
          index += match.words.length;
          continue;
        }
        if (/^\d+$/.test(words[index])) {
          const digits = [...words[index]].map((digit) => byKey.get(digit));
          if (digits.every(Boolean)) {
            digits.forEach((line) => result.push({ line, gap: 0.025 }));
            index++;
            continue;
          }
        }
        return null;
      }
      if (result.length) result[result.length - 1].gap = 0.11;
    }
    if (result.length) result[result.length - 1].gap = 0;
    return result.length ? result : null;
  }

  async function prepare(voiceId = getVoiceId()) {
    try {
      const data = await manifest(),
        voice = data.voices.find(({ id }) => id === voiceId) || data.voices[0],
        context = getContext();
      if (voice && context) await Promise.all([bufferFor(voice), stretchFor(context)]);
      return Boolean(voice);
    } catch (error) {
      console.warn('Bundled voice unavailable; using the device voice.', error);
      return false;
    }
  }

  async function speak(text, { rate = 0.95, onend } = {}) {
    const requestGeneration = generation;
    try {
      const data = await manifest(),
        voice = data.voices.find(({ id }) => id === getVoiceId()) || data.voices[0],
        clips = resolveText(data, text),
        context = getContext();
      if (!voice || !clips || !context) throw new Error('No matching bundled voice line');
      const [audioBuffer, stretch] = await Promise.all([bufferFor(voice), stretchFor(context)]);
      if (requestGeneration !== generation) return true;
      if (context.state !== 'running') await context.resume().catch(() => {});
      if (requestGeneration !== generation) return true;

      const playbackRate = clamp(rate / (data.generationSpeed || 1), 0.55, 1.8),
        samples = combineClips(audioBuffer, voice, clips, playbackRate),
        outputDuration = samples.length / audioBuffer.sampleRate / playbackRate;
      clearTimeout(endTimer);
      await stretch.node.stop();
      await stretch.node.dropBuffers();
      if (requestGeneration !== generation) return true;
      await stretch.node.addBuffers([samples], [samples.buffer]);
      if (requestGeneration !== generation) return true;
      const latency = Math.max(0.03, Number(await stretch.node.latency()) || 0),
        startAt = context.currentTime + latency;
      if (requestGeneration !== generation) return true;
      stretch.gain.gain.value = clamp(getVolume() / 100, 0, 1);
      await stretch.node.start(startAt, 0, outputDuration, playbackRate, 0);
      if (requestGeneration !== generation) return true;
      endTimer = setTimeout(
        () => {
          endTimer = null;
          if (requestGeneration === generation) onend?.();
        },
        Math.max(0, startAt - context.currentTime + outputDuration + 0.04) * 1000,
      );
      return true;
    } catch (error) {
      if (requestGeneration !== generation) return true;
      console.warn('Bundled line unavailable; using the device voice.', error);
      fallback(text, onend, rate);
      return false;
    }
  }

  function cancel() {
    generation++;
    clearTimeout(endTimer);
    endTimer = null;
    stretchPromise?.then(({ node }) => node.stop()).catch(() => {});
  }

  return { cancel, prepare, speak };
}
