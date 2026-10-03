/* Small progressive enhancements. Content and document links work without JS. */
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  const mobile = window.matchMedia('(max-width: 760px)');
  if (toggle && nav) {
    let open = false;
    const render = () => {
      toggle.hidden = !mobile.matches;
      nav.hidden = mobile.matches && !open;
      toggle.setAttribute('aria-expanded', String(mobile.matches && open));
      toggle.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', () => { open = !open; render(); });
    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (link) {
        open = false; render();
        // Email links can leave this document open; keep keyboard focus visible.
        if (mobile.matches && link.getAttribute('href').startsWith('mailto:')) toggle.focus();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobile.matches && open) {
        open = false; render(); toggle.focus();
      }
    });
    // Closing via a viewport change must not leave focus in a hidden menu.
    mobile.addEventListener('change', () => {
      const focusedInside = nav.contains(document.activeElement);
      open = false; render();
      if (mobile.matches && focusedInside) toggle.focus();
    });
    render();
  }

  const controls = document.querySelector('[data-archive-controls]');
  if (!controls) return;
  controls.hidden = false;
  const buttons = Array.from(controls.querySelectorAll('[data-filter]'));
  const yearSelect = controls.querySelector('select');
  const years = Array.from(document.querySelectorAll('[data-year]'));
  const count = document.querySelector('[data-archive-count]');
  const readFilters = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      division: ['NCMO', 'NCJMO'].includes(params.get('division')) ? params.get('division') : 'all',
      year: years.some(section => section.dataset.year === params.get('year')) ? params.get('year') : 'all'
    };
  };
  let filters = readFilters();
  const apply = () => {
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filters.division)));
    yearSelect.value = filters.year;
    let documents = 0;
    let visibleYears = 0;
    years.forEach(section => {
      section.hidden = filters.year !== 'all' && section.dataset.year !== filters.year;
      if (!section.hidden) visibleYears++;
      section.querySelectorAll('[data-division]').forEach(row => {
        row.hidden = filters.division !== 'all' && row.dataset.division !== filters.division && row.dataset.division !== 'both';
        if (!row.hidden && !section.hidden) documents++;
      });
    });
    count.textContent = `${documents} documents · ${visibleYears} ${visibleYears === 1 ? 'year' : 'years'} · ${filters.division === 'all' ? 'Both divisions' : filters.division + ' + shared results'}`;
  };
  const updateURL = () => {
    const url = new URL(window.location.href);
    ['division', 'year'].forEach(key => {
      if (filters[key] === 'all') url.searchParams.delete(key);
      else url.searchParams.set(key, filters[key]);
    });
    // A year anchor can point at a section hidden by the new year filter.
    if (filters.year !== 'all' && url.hash.startsWith('#year-')) url.hash = '';
    window.history.pushState({}, '', url);
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    if (filters.division === button.dataset.filter) return;
    filters.division = button.dataset.filter; apply(); updateURL();
  }));
  yearSelect.addEventListener('change', () => { filters.year = yearSelect.value; apply(); updateURL(); });
  window.addEventListener('popstate', () => { filters = readFilters(); apply(); });
  apply();
})();
