(() => {
  const english = /\/en\/?$/.test(location.pathname);
  const base = location.pathname.replace(/\/en\/?$/, '/').replace(/\/?$/, '/');
  // A shared article URL determines the language even for a returning reader.
  try {
    const country = english ? 'GB' : 'NL';
    localStorage.setItem('atelier-taal', country);
    document.documentElement.lang = { NL: 'nl-NL', BE: 'nl-BE', GB: 'en' }[country];
  } catch {}
  document.addEventListener('click', event => {
    const choice = event.target.closest('[data-menu-taal]');
    if (!choice) return;
    const nextEnglish = choice.dataset.land === 'GB';
    if (nextEnglish === english) return;
    event.stopImmediatePropagation();
    try { localStorage.setItem('atelier-taal', choice.dataset.land); } catch {}
    location.assign(base + (nextEnglish ? 'en/' : '') + location.search + location.hash);
  }, true);
})();
