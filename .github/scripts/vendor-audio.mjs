import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url))),
  source = resolve(root, 'node_modules/signalsmith-stretch/SignalsmithStretch.mjs'),
  destination = resolve(root, 'dist/assets/js/vendor/signalsmith-stretch.mjs');

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
console.log('Vendored Signalsmith Stretch for offline pitch-preserving voice playback.');
