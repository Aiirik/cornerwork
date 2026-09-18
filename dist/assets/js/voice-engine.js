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

export function createVoiceEngine({
  getContext,
  getVolume,
  getVoiceId,
  fallback,
  createMediaElement = () => (typeof Audio === 'function' ? new Audio() : null),
}) {
  let manifestPromise,
    generation = 0,
    media = null,
    mediaUrl = '',
    unlockingMedia = false;
  const buffers = new Map(),
    activeSources = new Set();

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

  function combinedSamples(audioBuffer, voice, clips, playbackRate) {
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
      samples = new Float32Array(
        pieces.reduce((total, piece) => total + piece.end - piece.start + piece.silence, 0),
      );
    let offset = 0;
    pieces.forEach(({ start, end, silence }) => {
      samples.set(channel.subarray(start, end), offset);
      offset += end - start + silence;
    });
    return samples;
  }

  function waveBlob(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2),
      view = new DataView(buffer),
      write = (offset, text) => {
        for (let index = 0; index < text.length; index++)
          view.setUint8(offset + index, text.charCodeAt(index));
      };
    write(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    write(8, 'WAVE');
    write(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((sample, index) => {
      const value = clamp(sample, -1, 1);
      view.setInt16(44 + index * 2, value < 0 ? value * 32768 : value * 32767, true);
    });
    return new Blob([buffer], { type: 'audio/wav' });
  }

  function pitchMedia() {
    if (media) return media;
    media = createMediaElement();
    if (!media) return null;
    media.preload = 'auto';
    media.preservesPitch = true;
    media.webkitPreservesPitch = true;
    media.mozPreservesPitch = true;
    return media;
  }

  function releaseMediaUrl() {
    if (!mediaUrl) return;
    URL.revokeObjectURL(mediaUrl);
    mediaUrl = '';
  }

  function unlock() {
    const audio = pitchMedia();
    if (!audio || !audio.paused || audio.src) return;
    unlockingMedia = true;
    audio.volume = 0;
    audio.src =
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
    const playPromise = audio.play();
    playPromise
      ?.then(() => {
        if (!unlockingMedia) return;
        audio.pause();
        audio.removeAttribute('src');
        audio.load?.();
        unlockingMedia = false;
      })
      .catch(() => {
        unlockingMedia = false;
      });
  }

  async function playPitchPreserved(samples, sampleRate, playbackRate, requestGeneration, onend) {
    const audio = pitchMedia();
    if (
      !audio ||
      typeof Blob !== 'function' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function'
    )
      return false;
    unlockingMedia = false;
    audio.pause();
    releaseMediaUrl();
    mediaUrl = URL.createObjectURL(waveBlob(samples, sampleRate));
    audio.src = mediaUrl;
    audio.volume = clamp(getVolume() / 100, 0, 1);
    audio.defaultPlaybackRate = playbackRate;
    audio.playbackRate = playbackRate;
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
    audio.mozPreservesPitch = true;
    let started = false;
    audio.onended = () => {
      releaseMediaUrl();
      if (requestGeneration === generation) onend?.();
    };
    audio.onerror = () => {
      releaseMediaUrl();
      if (started && requestGeneration === generation) onend?.();
    };
    try {
      await audio.play();
      started = true;
      return true;
    } catch (error) {
      audio.onended = null;
      releaseMediaUrl();
      return false;
    }
  }

  async function prepare(voiceId = getVoiceId()) {
    try {
      const data = await manifest(),
        voice = data.voices.find(({ id }) => id === voiceId) || data.voices[0];
      if (voice) await bufferFor(voice);
      return Boolean(voice);
    } catch (error) {
      console.warn('Bundled voice unavailable; using the device voice.', error);
      return false;
    }
  }

  async function speak(text, { rate, onend } = {}) {
    const requestGeneration = generation;
    try {
      const data = await manifest(),
        voice = data.voices.find(({ id }) => id === getVoiceId()) || data.voices[0],
        clips = resolveText(data, text),
        context = getContext();
      if (!voice || !clips || !context) throw new Error('No matching bundled voice line');
      const audioBuffer = await bufferFor(voice);
      if (requestGeneration !== generation) return true;
      if (context.state !== 'running') await context.resume().catch(() => {});
      if (requestGeneration !== generation) return true;

      const playbackRate = rate == null ? 1 : clamp(rate / (data.generationSpeed || 1), 0.55, 1.8),
        gain = context.createGain();
      if (playbackRate !== 1) {
        const samples = combinedSamples(audioBuffer, voice, clips, playbackRate);
        if (
          await playPitchPreserved(
            samples,
            audioBuffer.sampleRate,
            playbackRate,
            requestGeneration,
            onend,
          )
        )
          return true;
        if (requestGeneration !== generation) return true;
      }
      gain.gain.value = clamp(getVolume() / 100, 0, 1);
      gain.connect(context.destination);
      let when = context.currentTime + 0.015,
        finalSource;
      clips.forEach(({ line, gap }) => {
        const clip = voice.clips[line.id];
        if (!clip) throw new Error(`Missing bundled clip: ${line.key}`);
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = playbackRate;
        source.connect(gain);
        activeSources.add(source);
        source.onended = () => activeSources.delete(source);
        source.start(when, clip.start, clip.duration);
        when += clip.duration / playbackRate + gap;
        finalSource = source;
      });
      if (finalSource) {
        const originalEnd = finalSource.onended;
        finalSource.onended = () => {
          originalEnd();
          if (requestGeneration === generation) onend?.();
        };
      }
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
    unlockingMedia = false;
    if (media) {
      media.onended = null;
      media.onerror = null;
      media.pause();
      releaseMediaUrl();
      media.removeAttribute('src');
    }
    activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (error) {}
    });
    activeSources.clear();
  }

  return { cancel, prepare, speak, unlock };
}
