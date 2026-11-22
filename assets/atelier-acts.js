(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const registered = new WeakSet();
  const onscreen = new Set();
  const lastPlayed = new WeakMap();

  function play(actor) {
    if (reduce.matches || document.hidden || actor.classList.contains('act-playing')) return;
    if (performance.now() - (lastPlayed.get(actor) ?? -Infinity) < 4500) return;
    lastPlayed.set(actor, performance.now());
    actor.classList.add('act-playing');
  }
  const observer = new IntersectionObserver(entries => {
    for (const {target, intersectionRatio} of entries) {
      if (intersectionRatio >= .5) {
        onscreen.add(target);
        play(target);
      } else {
        target.classList.remove('act-playing');
        onscreen.delete(target);
      }
    }
  }, {threshold: [0, .5]});

  document.addEventListener('animationend', e => {
    if (e.animationName.startsWith('act-') && e.target.classList.contains('act-playing')) {
      e.target.classList.remove('act-playing');
    }
  });
  document.addEventListener('toggle', event => {
    if (event.target.matches('details.guide-contents[open]')) {
      const librarian = event.target.querySelector('.act-librarian');
      if (librarian && onscreen.has(librarian)) play(librarian);
    }
  }, true);
  function syncPreference() {
    for (const actor of onscreen) {
      if (reduce.matches || document.hidden) actor.classList.remove('act-playing');
      else play(actor);
    }
  }
  reduce.addEventListener('change', syncPreference);
  document.addEventListener('visibilitychange', syncPreference);

  function register(actor, action) {
    if (registered.has(actor)) return;
    registered.add(actor);
    actor.dataset.atelierAct = action;
    observer.observe(actor);
  }
  function makeActor(action, role, prop) {
    const actor = document.createElement('span');
    actor.className = 'atelier-act act-' + action;
    actor.setAttribute('aria-hidden', 'true');
    for (const part of prop ? ['body', 'prop'] : ['body']) {
      const img = document.createElement('img');
      img.src = '/assets/atelier-crew/' + role + '-' + part + '.webp';
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      actor.append(img);
    }
    actor.append(document.createElement('i'));
    return actor;
  }
  function stage(selector, action, role, prop) {
    for (const title of document.querySelectorAll(selector)) {
      if (title.previousElementSibling?.classList.contains('act-' + action)) continue;
      const actor = makeActor(action, role, prop);
      title.before(actor);
      register(actor, action);
    }
  }
  // The same slug identifies the Dutch and English editions.
  const articleGestures = {
    website: ['measure', '↔'], webshop: ['count', '€'], ai: ['search', '?'],
    'seo-geo': ['search', '⌕'], 'social-kosten': ['snap', '✧'], 'meta-budget': ['count', '€'],
    'ai-agent': ['sort', '✓'], 'chatbot-kosten': ['reply', '···'],
    'website-onderhoud': ['repair', '✓'], 'webshop-conversie': ['measure', '↗'],
    checkout: ['tap', '✓'], 'nieuwe-markt': ['map', '⚑']
  };
  const article = articleGestures[location.pathname.split('/')[2]];
  function decorate() {
    stage('#newsletter.r2-news > h2', 'post', 'onboarding', false);
    stage('#tools .split-title h2, #tools .wa-mobile h2', 'repair', 'onderhoud', true);
    for (const summary of document.querySelectorAll('details.guide-contents > summary')) {
      if (summary.querySelector('.act-librarian')) continue;
      const librarian = makeActor('librarian', 'zoeken', true);
      summary.append(librarian);
      register(librarian, 'search');
    }
    for (const actor of document.querySelectorAll('.atelier-cameo')) {
      const role = actor.querySelector('img')?.src.split('/').pop().split('-body')[0];
      if (actor.matches('.cameo-reader') && article) {
        if (!actor.querySelector('.act-signal')) {
          const signal = document.createElement('i');
          signal.className = 'act-signal';
          signal.textContent = article[1];
          actor.append(signal);
        }
        register(actor, article[0]);
        continue;
      }
      const action = {zoeken:'search', advertenties:'announce', onderhoud:'repair', social:'snap', website:'measure', conversie:'measure'}[role];
      register(actor, action || (actor.matches('.cameo-letter,.cameo-screen') ? 'game' : 'peek'));
    }
    for (const [selector, action] of [
      ['.atelier-speler-telefoon', 'game'], ['.atelier-speler-zwemmer', 'swim'],
      ['.atelier-speler-promotor', 'announce']
    ]) {
      document.querySelectorAll(selector).forEach(actor => register(actor, action));
    }
    for (const [selector, role, file] of [
      ['#werk .wa-mobile .desktop-device', 'game','telefoon'],
      ['#atelier .wa-mobile .oprichter-lead', 'announce','promotor']
    ]) {
      for (const host of document.querySelectorAll(selector)) {
        if (host.querySelector('.act-mobile')) continue;
        const actor = document.createElement('span');
        actor.className = 'atelier-act act-mobile act-' + role;
        actor.setAttribute('aria-hidden','true');
        const img = document.createElement('img');
        img.src = '/assets/atelier-scenes/' + file + '.webp';
        img.alt = '';
        img.loading = 'lazy';
        actor.append(img, document.createElement('i'));
        host.append(actor);
        register(actor, role);
      }
    }
  }
  decorate();
  // The mobile renderer replaces whole panels on slide and locale changes.
  let pending = false;
  const renderObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const el of record.removedNodes) {
        if (el.nodeType !== 1 || el.isConnected) continue;
        for (const actor of [el, ...el.querySelectorAll('[data-atelier-act]')]) {
          if (!registered.has(actor)) continue;
          observer.unobserve(actor);
          onscreen.delete(actor);
          registered.delete(actor);
        }
      }
    }
    if (pending || !records.some(record => [...record.addedNodes].some(el =>
      el.nodeType === 1 && (el.matches('.wa-mobile,.werk-panel,.devices,.desktop-device,.oprichter-lead') ||
      el.querySelector('.wa-mobile,.desktop-device,.oprichter-lead'))))) return;
    pending = true;
    requestAnimationFrame(() => {pending = false; decorate();});
  });
  document.querySelectorAll('#werk,#atelier,#tools').forEach(section => renderObserver.observe(section, {childList:true,subtree:true}));
  document.addEventListener('click', event => {
    const host = event.target.closest('figure,.cameo-photo,.case-stage,.werk-panel,.oprichter-lead,#tools,#newsletter,.cameo-options,.aanpak-kop,.cameo-monitor');
    if (host) for (const actor of host.querySelectorAll('[data-atelier-act]')) {
      if (onscreen.has(actor)) play(actor);
    }
  });
})();
