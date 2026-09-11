import { access, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distRoot = path.join(repositoryRoot, 'dist');
const iconsRoot = path.join(distRoot, 'assets/icons');
const requiredFiles = ['icon.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

const entries = await readdir(iconsRoot, { withFileTypes: true });
const alternateNumbers = entries
  .filter((entry) => entry.isDirectory() && /^alt[1-9]\d*$/.test(entry.name))
  .map((entry) => Number(entry.name.slice(3)))
  .sort((a, b) => a - b);

alternateNumbers.forEach((number, index) => {
  const expected = index + 1;
  if (number !== expected) {
    throw new Error(
      `Icon folders must be consecutive. Expected alt${expected}, found alt${number}.`,
    );
  }
});

const themes = ['default', ...alternateNumbers.map((number) => `alt${number}`)];

for (const theme of themes) {
  const folder = theme === 'default' ? iconsRoot : path.join(iconsRoot, theme);
  for (const filename of requiredFiles) {
    await access(path.join(folder, filename)).catch(() => {
      const relativePath =
        theme === 'default' ? `assets/icons/${filename}` : `assets/icons/${theme}/${filename}`;
      throw new Error(`${theme} is missing ${relativePath}`);
    });
  }
}

const manifestFor = (theme) => {
  const folder = theme === 'default' ? 'assets/icons' : `assets/icons/${theme}`;
  return {
    name: 'Cornerwork Boxing Coach',
    short_name: 'Cornerwork',
    description: 'A customizable boxing timer and combo coach.',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#090b0f',
    theme_color: '#090b0f',
    icons: [
      {
        src: `${folder}/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: `${folder}/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: `${folder}/apple-touch-icon.png`,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
};

await writeFile(
  path.join(iconsRoot, 'catalog.json'),
  JSON.stringify({ themes: themes.map((id) => ({ id })) }, null, 2) + '\n',
);

for (const theme of themes) {
  const filename = theme === 'default' ? 'manifest.webmanifest' : `manifest-${theme}.webmanifest`;
  await writeFile(
    path.join(distRoot, filename),
    JSON.stringify(manifestFor(theme), null, 2) + '\n',
  );
}

console.log(`Generated ${themes.length} Cornerwork icon choices: ${themes.join(', ')}`);
