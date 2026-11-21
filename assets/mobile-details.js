(() => {
  const narrow = matchMedia('(max-width: 680px)');
  const restore = [];
  let contactLinks;

  function disclosure(container, title, kind, initiallyOpen = false) {
    const details = document.createElement('details');
    details.className = 'wa-mobile-fold wa-mobile-' + kind;
    const summary = document.createElement('summary');
    if (kind === 'team') {
      summary.classList.add('scene');
      summary.append(...title.childNodes);
      title.remove();
    } else {
      summary.append(title);
    }
    const originalChildren = Array.from(container.childNodes);
    details.open = initiallyOpen;
    details.append(summary, ...originalChildren);
    container.append(details);
    restore.push(() => {
      if (kind === 'team') title.append(...summary.childNodes);
      container.replaceChildren(title, ...originalChildren);
    });
  }

  function openProfileGroup() {
    if (!/^#profiel-\d+$/.test(location.hash)) return;
    const target = document.getElementById(location.hash.slice(1));
    const group = target?.closest('.wa-mobile-team');
    if (group) group.open = true;
  }

  function contactShortcuts() {
    if (!/^\/contact\/?$/.test(location.pathname)) return;
    const intro = document.querySelector('#contact .contact-hero-copy');
    if (!intro || !document.getElementById('boeken') || !document.getElementById('bericht')) return;
    contactLinks = document.createElement('div');
    contactLinks.className = 'wa-contact-shortcuts';
    for (const [href, dutch, english] of [
      ['#bericht', 'Bericht sturen', 'Send a message'],
      ['#boeken', 'Belafspraak plannen', 'Book a call'],
    ]) {
      const link = document.createElement('a');
      link.href = href;
      link.dataset.nl = dutch;
      link.dataset.en = english;
      contactLinks.append(link);
    }
    updateLanguage();
    intro.append(contactLinks);
  }

  function updateLanguage() {
    const english = document.documentElement.lang.startsWith('en');
    for (const link of contactLinks?.children || []) {
      link.textContent = english ? link.dataset.en : link.dataset.nl;
    }
  }

  function updateLayout() {
    if (!narrow.matches) {
      while (restore.length) restore.pop()();
      contactLinks?.remove();
      contactLinks = null;
      return;
    }
    document.querySelectorAll('#commerce-surface .branches > .branch').forEach((branch) => {
      const title = branch.querySelector(':scope > .scene');
      if (title) disclosure(branch, title, 'team');
    });
    document.querySelectorAll('.pakket-optie-grid > .pakket-opties').forEach((group, i) => {
      const title = group.querySelector(':scope > h3');
      if (title) disclosure(group, title, 'service', i === 0);
    });
    document.querySelectorAll('#atelier-foot .af-story, #atelier-foot .af-top > div:has(> .af-nav)').forEach((section) => {
      const title = section.querySelector(':scope > h3');
      if (title) disclosure(section, title, 'footer');
    });
    contactShortcuts();
    openProfileGroup();
  }
  updateLayout();
  narrow.addEventListener('change', updateLayout);
  window.addEventListener('hashchange', openProfileGroup);
  new MutationObserver(updateLanguage).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
})();
