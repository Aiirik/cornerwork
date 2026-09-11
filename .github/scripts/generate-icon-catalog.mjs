import { access, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distRoot = path.join(repositoryRoot, 'dist');
const iconsRoot = path.join(distRoot, 'assets/icons');
const requiredFiles = ['icon.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const naturalSort = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const manifestName = (folder) => `manifest-${folder}.webmanifest`;

const entries = await readdir(iconsRoot, { withFileTypes: true });
const iconFolders = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort(naturalSort.compare);

for (const folder of iconFolders) {
  if (folder.toLowerCase() === 'default') {
    throw new Error(
      'The folder name "default" is reserved for the icons directly in assets/icons.',
    );
  }
}

const themes = ['default', ...iconFolders];

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
  const folder = theme === 'default' ? 'assets/icons' : `assets/icons/${encodeURIComponent(theme)}`;
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
  const filename = theme === 'default' ? 'manifest.webmanifest' : manifestName(theme);
  await writeFile(
    path.join(distRoot, filename),
    JSON.stringify(manifestFor(theme), null, 2) + '\n',
  );
}

console.log(`Generated ${themes.length} Cornerwork icon choices: ${themes.join(', ')}`);
