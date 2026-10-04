/* Apply the theme before styles load, then connect the accessible toggle. */
(() => {
  const storageKey = 'ncjmo-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const validTheme = value => value === 'light' || value === 'dark';
  let preference;
  let button;

  try {
    const saved = localStorage.getItem(storageKey);
    if (validTheme(saved)) preference = saved;
  } catch (_) {
    // The toggle still works when browser storage is unavailable.
  }

  const apply = () => {
    const theme = preference || (system.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    if (themeColor) themeColor.content = theme === 'dark' ? '#17231f' : '#f7f5ee';
    if (button) {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
  };
  apply();

  system.addEventListener('change', () => {
    if (!preference) apply();
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = validTheme(event.newValue) ? event.newValue : undefined;
    apply();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try {
      const saved = localStorage.getItem(storageKey);
      preference = validTheme(saved) ? saved : undefined;
    } catch (_) {
      // Retain the page's choice if browser storage is unavailable.
    }
    apply();
  });

  document.addEventListener('DOMContentLoaded', () => {
    button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(storageKey, preference);
      } catch (_) {
        // Retain the choice for this page even if it cannot be saved.
      }
      apply();
    });
    apply();
    button.hidden = false;
  });
})();
