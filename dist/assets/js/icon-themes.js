// App icon gallery helpers.
//
// Icon folders are registered automatically during deployment. To add another
// choice, create the next consecutive folder in assets/icons (for example,
// alt4) and include the four files listed in assets/icons/README.md.

const CATALOG_URL = 'assets/icons/catalog.json';
const ICON_ID_PATTERN = /^(default|alt[1-9]\d*)$/;

export function isIconThemeId(value) {
  return ICON_ID_PATTERN.test(String(value || ''));
}

export function createIconTheme(id) {
  const safeId = isIconThemeId(id) ? id : 'default';
  const isDefault = safeId === 'default';
  const number = isDefault ? '' : safeId.slice(3);

  return {
    id: safeId,
    label: isDefault ? 'Default' : 'Alt ' + number,
    root: 'assets/icons' + (isDefault ? '' : '/' + safeId),
    manifest: isDefault ? 'manifest.webmanifest' : 'manifest-' + safeId + '.webmanifest',
  };
}

export async function loadIconThemes(preferredId = 'default') {
  try {
    const response = await fetch(CATALOG_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Icon catalogue could not be loaded.');
    const catalogue = await response.json();
    const ids = Array.isArray(catalogue.themes)
      ? catalogue.themes.map((theme) => theme.id).filter(isIconThemeId)
      : [];
    if (!ids.includes('default')) ids.unshift('default');
    return [...new Set(ids)].map(createIconTheme);
  } catch (error) {
    const fallbackIds = ['default'];
    if (preferredId !== 'default' && isIconThemeId(preferredId)) fallbackIds.push(preferredId);
    return fallbackIds.map(createIconTheme);
  }
}

export function renderIconThemeOptions(container, themes) {
  container.innerHTML = themes
    .map(
      (theme) =>
        '<button class="icon-picker-option" type="button" data-icon-theme="' +
        theme.id +
        '" role="radio" aria-checked="false"><span class="icon-picker-preview"><img src="' +
        theme.root +
        '/icon.png" alt="' +
        theme.label +
        ' Cornerwork icon"></span><strong>' +
        theme.label +
        '</strong><span class="icon-picker-check" aria-hidden="true"><svg class="ui-icon"><use href="assets/icons/ui-icons.svg#icon-check"></use></svg></span></button>',
    )
    .join('');
}
