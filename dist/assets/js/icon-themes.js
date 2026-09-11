// App icon gallery helpers.
//
// Icon folders are registered automatically during deployment. The folder name
// becomes the label shown in the gallery. See assets/icons/README.md.

const CATALOG_URL = 'assets/icons/catalog.json?v=186';

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

export function isIconThemeId(value) {
  return typeof value === 'string' && value.length > 0;
}

export function createIconTheme(id) {
  const safeId = isIconThemeId(id) ? id : 'default';
  const isDefault = safeId === 'default';

  return {
    id: safeId,
    label: isDefault ? 'Default' : safeId,
    root: 'assets/icons' + (isDefault ? '' : '/' + encodeURIComponent(safeId)),
    manifest: isDefault
      ? 'manifest.webmanifest'
      : `manifest-${encodeURIComponent(safeId)}.webmanifest`,
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
    .map((theme) => {
      const id = escapeHtml(theme.id);
      const label = escapeHtml(theme.label);
      const root = escapeHtml(theme.root);
      return (
        '<button class="icon-picker-option" type="button" data-icon-theme="' +
        id +
        '" role="radio" aria-checked="false"><span class="icon-picker-preview"><img src="' +
        root +
        '/icon.png" alt="' +
        label +
        ' Cornerwork icon"></span><strong>' +
        label +
        '</strong><span class="icon-picker-check" aria-hidden="true"><svg class="ui-icon"><use href="assets/icons/ui-icons.svg#icon-check"></use></svg></span></button>'
      );
    })
    .join('');
}
