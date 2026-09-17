import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOICE_LINES, VOICE_PACKS } from './voice-lines.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url))),
  directory = resolve(root, 'dist/assets/voices'),
  manifestPath = resolve(directory, 'manifest.json');

if (!existsSync(manifestPath)) throw new Error('Missing dist/assets/voices/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')),
  expectedLineIds = new Set(VOICE_LINES.map((line) => line.id)),
  actualLineIds = new Set((manifest.lines || []).map((line) => line.id));

for (const id of expectedLineIds)
  if (!actualLineIds.has(id)) throw new Error(`Voice manifest is missing line ${id}`);
for (const pack of VOICE_PACKS) {
  const voice = manifest.voices?.find((item) => item.id === pack.id),
    audioPath = resolve(directory, `${pack.id}.opus`);
  if (!voice) throw new Error(`Voice manifest is missing ${pack.id}`);
  if (!existsSync(audioPath) || statSync(audioPath).size < 1024)
    throw new Error(`Voice audio is missing or empty: ${audioPath}`);
  for (const id of expectedLineIds)
    if (!voice.clips?.[id]) throw new Error(`${pack.id} is missing voice line ${id}`);
}

console.log(
  `Validated ${VOICE_PACKS.length} bundled voices and ${VOICE_LINES.length} required lines.`,
);
