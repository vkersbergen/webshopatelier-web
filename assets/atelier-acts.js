(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const registered = new WeakSet();
  const onscreen = new Set();
  const sheets = new Map();
  const portraits = new WeakMap();
  let portraitPaused = false;

  function prepareSheet(url) {
    if (!sheets.has(url)) {
      const image = new Image();
      image.src = url;
      sheets.set(url, image.decode().then(() => image, () => {
        sheets.delete(url);
        return null;
      }));
    }
    return sheets.get(url);
  }

  function stop(actor) {
    const state = portraits.get(actor);
    if (state) {
      cancelAnimationFrame(state.request);
      state.previous = null;
    }
    actor.classList.remove('act-playing');
  }

  // Integer source rectangles keep every part of the horn inside its own tile
  // even at fractional mobile display widths and non-integer device scale.
  function animatePortrait(actor, state) {
    function draw(now) {
      if (!actor.classList.contains('act-playing') || !actor.isConnected) return;
      if (state.previous !== null) state.time += now - state.previous;
      state.previous = now;
      const frame = Math.floor(state.time * 16 / 1000) % 96;
      if (frame !== state.frame) {
        state.frame = frame;
        const width = state.sheet.naturalWidth / 8;
        const height = state.sheet.naturalHeight / 12;
        state.ctx.clearRect(0, 0, width, height);
        state.ctx.drawImage(state.sheet, frame % 8 * width, Math.floor(frame / 8) * height,
          width, height, 0, 0, width, height);
      }
      state.request = requestAnimationFrame(draw);
    }
    state.request = requestAnimationFrame(draw);
  }

  async function play(actor) {
    const allowed = () => !reduce.matches && !document.hidden && onscreen.has(actor) &&
      !(portraitPaused && portraits.has(actor)) && !actor.classList.contains('act-playing');
    if (!allowed()) return;
    const sheet = await prepareSheet(actor.dataset.actSheet);
    if (!sheet || !actor.isConnected || !allowed()) return;
    actor.setAttribute('data-frames-ready', '');
    actor.classList.add('act-playing');
    const state = portraits.get(actor);
    if (state) {
      if (!state.sheet) {
        state.sheet = sheet;
        state.ctx.canvas.width = sheet.naturalWidth / 8;
        state.ctx.canvas.height = sheet.naturalHeight / 12;
      }
      animatePortrait(actor, state);
    }
  }
  const observer = new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (isIntersecting) {
        onscreen.add(target);
        play(target);
      } else {
        onscreen.delete(target);
        stop(target);
      }
    }
  });
  document.addEventListener('toggle', event => {
    if (event.target.matches('details.guide-contents[open]')) {
      const librarian = event.target.querySelector('.act-librarian');
      if (librarian && onscreen.has(librarian)) play(librarian);
    }
  }, true);
  function syncPreference() {
    document.querySelectorAll('button.act-portrait').forEach(actor => { actor.disabled = reduce.matches; });
    for (const actor of onscreen) {
      if (reduce.matches || document.hidden) stop(actor);
      else play(actor);
    }
  }
  reduce.addEventListener('change', syncPreference);
  document.addEventListener('visibilitychange', syncPreference);

  function register(actor, action) {
    if (registered.has(actor)) return;
    registered.add(actor);
    actor.dataset.atelierAct = action;
    if (action === 'portrait') {
      actor.dataset.actSheet = '/assets/atelier-scenes/promotor-spel.webp?v=288-96';
    } else {
      const body = actor.querySelector('img[src*="/atelier-crew/"][src$="-body.webp"]');
      if (body) {
        const role = body.src.split('/').pop().replace('-body.webp', '');
        const sheet = '/assets/atelier-crew/acts/' + role + '.webp';
        actor.dataset.actSheet = sheet;
        actor.style.setProperty('--role-sheet', 'url("' + sheet + '")');
        actor.classList.add('act-role');
      }
    }
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
      if (!actor.matches('.cameo-reader,.cameo-screen,.cameo-letter')) register(actor, 'role');
    }
    for (const portrait of document.querySelectorAll('.founder-photo, #atelier .wa-mobile .oprichter-lead')) {
      if (portrait.querySelector('.act-portrait')) continue;
      const oldActor = portrait.querySelector('.atelier-speler-promotor');
      const actor = document.createElement('button');
      actor.type = 'button';
      actor.disabled = reduce.matches;
      actor.className = 'atelier-act act-portrait';
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      actor.append(canvas);
      portraits.set(actor, {ctx: canvas.getContext('2d'), time: 0, frame: -1, previous: null, request: 0});
      const updateLabel = () => {
        const en = document.documentElement.lang.startsWith('en');
        actor.setAttribute('aria-label', en ? 'Pause megaphone animation' : 'Megafoonanimatie pauzeren');
        actor.setAttribute('aria-pressed', String(portraitPaused));
      };
      updateLabel();
      actor.addEventListener('click', () => {
        if (reduce.matches) return;
        portraitPaused = !portraitPaused;
        document.querySelectorAll('button.act-portrait').forEach(other => {
          other.setAttribute('aria-pressed', String(portraitPaused));
          if (portraitPaused) stop(other);
          else if (onscreen.has(other)) play(other);
        });
      });
      if (oldActor) oldActor.replaceWith(actor);
      else portrait.append(actor);
      register(actor, 'portrait');
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
          stop(actor);
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
