import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KokoroTTS } from 'kokoro-js';
import { VOICE_LINES, VOICE_PACKS } from './voice-lines.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url))),
  outputDirectory = join(root, 'dist/assets/voices'),
  sampleRate = 24000,
  generationSpeed = 1.2,
  separatorSeconds = 0.08,
  separator = new Float32Array(Math.round(sampleRate * separatorSeconds)),
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'cornerwork-voices-'));

function trimSilence(samples) {
  const threshold = 0.0025,
    margin = Math.round(sampleRate * 0.025);
  let start = 0,
    end = samples.length;
  while (start < end && Math.abs(samples[start]) < threshold) start++;
  while (end > start && Math.abs(samples[end - 1]) < threshold) end--;
  start = Math.max(0, start - margin);
  end = Math.min(samples.length, end + margin);
  return samples.slice(start, end);
}

function writeWave(path, samples) {
  const bytesPerSample = 2,
    dataLength = samples.length * bytesPerSample,
    buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  samples.forEach((sample, index) => {
    const value = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(value < 0 ? value * 32768 : value * 32767), 44 + index * 2);
  });
  writeFileSync(path, buffer);
}

console.log(`Loading Kokoro for ${VOICE_LINES.length} Cornerwork voice lines…`);
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
  dtype: 'q8',
  device: 'cpu',
});

const manifest = {
  version: 1,
  model: 'hexgrad/Kokoro-82M v1.0',
  modelLicense: 'Apache-2.0',
  generationSpeed,
  voices: [],
  lines: VOICE_LINES,
};

for (const pack of VOICE_PACKS) {
  console.log(`Generating ${pack.label}…`);
  const pieces = [],
    clips = {};
  let cursor = 0;
  for (const [index, line] of VOICE_LINES.entries()) {
    const generated = await tts.generate(line.text, {
        voice: pack.modelVoice,
        speed: generationSpeed,
      }),
      samples = trimSilence(generated.audio),
      start = cursor / sampleRate,
      duration = samples.length / sampleRate;
    pieces.push(samples, separator);
    clips[line.id] = { start, duration };
    cursor += samples.length + separator.length;
    if ((index + 1) % 20 === 0 || index === VOICE_LINES.length - 1)
      console.log(`  ${index + 1}/${VOICE_LINES.length}`);
  }
  const sprite = new Float32Array(cursor);
  let offset = 0;
  for (const piece of pieces) {
    sprite.set(piece, offset);
    offset += piece.length;
  }
  const wavePath = join(temporaryDirectory, `${pack.id}.wav`),
    outputPath = join(outputDirectory, `${pack.id}.opus`);
  writeWave(wavePath, sprite);
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    wavePath,
    '-c:a',
    'libopus',
    '-b:a',
    '32k',
    '-vbr',
    'on',
    '-application',
    'voip',
    outputPath,
  ]);
  manifest.voices.push({
    id: pack.id,
    label: pack.label,
    description: pack.description,
    file: `${pack.id}.opus`,
    clips,
  });
}

writeFileSync(join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Cornerwork voice packs generated.');
