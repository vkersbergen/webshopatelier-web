(() => {
  const footer = document.getElementById('atelier-foot');
  const slot = footer?.querySelector('#newsletter');
  if (!slot) return;

  const popup = footer.querySelector('.af-popup');
  const inline = slot.querySelector('iframe');
  const spin = popup.querySelector('.rad-spin');
  const disc = popup.querySelector('.rad-disc');
  const wheel = popup.querySelector('.rad-wheel');
  const out = popup.querySelector('.rad-out');
  const origin = 'https://tally.so';
  const lang = () => document.documentElement.lang.startsWith('en') ? 'en' : 'nl';
  const ids = {nl:slot.dataset.formNl,en:slot.dataset.formEn};
  const joinedKey = 'atelierpost.joined';
  const laterKey = 'atelierpost.nextInvitation';
  const week = 7 * 24 * 60 * 60 * 1000;
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key,value) => { try { localStorage.setItem(key,value); } catch {} };
  let subscribed = Boolean(read(joinedKey));
  let prompted = false;
  let inlineLoaded = false;
  let readingTime = false;
  let previousFocus;

  const slots = Array.from({length:6}, (_, i) => i % 2
    ? ['×', 'helaas', 'no prize']
    : ['10%', 'korting', 'discount']);
  const resultKey = 'atelierwheel.ai10.result.v1';
  const claim = popup.querySelector('.rad-claim');
  let result = null;
  let spinning = false;
  slots.forEach(([name], i) => {
    const label = document.createElement('div');
    label.className = 'rad-label' + (i % 2 ? ' rad-dark' : '');
    label.style.setProperty('--a', i * 60 + 'deg');
    const text = document.createElement('span');
    text.append(name, document.createElement('small'));
    label.append(text);
    const line = document.createElement('div');
    line.className = 'rad-line';
    line.style.setProperty('--a', (i * 60 - 30) + 'deg');
    disc.append(label, line);
  });
  for (let i = 0; i < 24; i++) {
    const peg = document.createElement('i');
    peg.className = 'rad-peg';
    peg.style.setProperty('--a', i * 15 + 'deg');
    wheel.prepend(peg);
  }
  function savedResult() {
    const value = read(resultKey);
    return /^[0-5]$/.test(value ?? '') ? Number(value) : null;
  }
  function angleFor(index) {
    return (360 - index * 60) % 360;
  }
  function restoreWheel() {
    const stored = savedResult();
    if (stored !== null && !spinning) {
      result = stored;
      disc.style.transition = 'none';
      disc.style.transform = 'rotate(' + angleFor(result) + 'deg)';
    }
    syncWheel();
  }
  function syncWheel() {
    const en = lang() === 'en';
    disc.querySelectorAll('small').forEach((label, i) => { label.textContent = slots[i][en ? 2 : 1]; });
    spin.disabled = spinning || result !== null;
    spin.hidden = result !== null && !spinning;
    spin.textContent = en ? 'Spin the wheel ↻' : 'Draai het rad ↻';
    const won = result !== null && result % 2 === 0;
    claim.hidden = spinning || !won;
    claim.href = 'mailto:hello@webshopatelier.nl?subject=' + encodeURIComponent(en ? 'Custom AI agent quote – ATELIER10' : 'Offerte AI-agent op maat – ATELIER10');
    if (spinning) out.textContent = en ? 'Spinning…' : 'Het rad draait…';
    else if (result === null) out.textContent = '';
    else if (won) out.textContent = en ? 'You won 10% off a custom AI agent. Include code ATELIER10 when you request your quote.' : 'Je wint 10% korting op een AI-agent op maat. Geef de code ATELIER10 door bij je offerteaanvraag.';
    else out.textContent = en ? 'No prize this time. Thanks for playing!' : 'Deze keer geen prijs. Bedankt voor het meedoen!';
  }
  function startSpin() {
    if (spinning || result !== null) return;
    if (savedResult() !== null) return restoreWheel();
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    const index = Math.floor(random * slots.length);
    save(resultKey, String(index));
    if (savedResult() !== index) {
      out.textContent = lang() === 'en' ? 'Allow browser storage so we can save your spin.' : 'Sta browseropslag toe om je draai te bewaren.';
      return;
    }
    result = index;
    spinning = true;
    disc.style.transform = 'rotate(' + (1440 + angleFor(result)) + 'deg)';
    syncWheel();
    setTimeout(() => { spinning = false; syncWheel(); },
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 3550);
  }
  spin.addEventListener('click', () => {
    if (navigator.locks) navigator.locks.request(resultKey, startSpin);
    else startSpin();
  });
  window.addEventListener('storage', event => {
    if (event.key === resultKey) restoreWheel();
  });

  function load(frame) {
    const id = ids[lang()];
    const url = origin + '/embed/' + id + '?alignLeft=1&hideTitle=1';
    frame.title = lang() === 'en' ? 'Sign up for Studio notes' : 'Schrijf je in voor Atelierpost';
    if (frame.getAttribute('src') !== url) frame.src = url;
  }
  function sync() {
    const english = lang() === 'en';
    footer.querySelectorAll('[data-af-nl]').forEach(node => {
      node.textContent = english ? node.dataset.afEn : node.dataset.afNl;
    });
    popup.querySelector('button').setAttribute('aria-label',english ? 'Close' : 'Sluiten');
    slot.querySelector('.af-confirm').hidden = !subscribed;
    inline.hidden = subscribed;
    if (inlineLoaded && !subscribed) load(inline);
    syncWheel();
  }
  function stopAuto() {
    window.removeEventListener('scroll',maybeInvite);
  }
  function maybeInvite() {
    if (prompted || subscribed || read(joinedKey) || Date.now() < Number(read(laterKey))) return stopAuto();
    if (!readingTime || document.hidden || scrollY < innerHeight * .75) return;
    if (footer.getBoundingClientRect().top < innerHeight ||
        document.querySelector('dialog[open],#chat-panel:not([hidden])') ||
        document.activeElement?.matches('input,textarea,iframe,select,[contenteditable="true"]')) return;
    openWheel();
  }
  function openWheel() {
    if (popup.open) return;
    prompted = true;
    stopAuto();
    restoreWheel();
    previousFocus = document.activeElement;
    popup.showModal();
    save(laterKey,String(Date.now()+week));
  }
  footer.querySelector('.af-wheel-link').addEventListener('click', openWheel);
  popup.querySelector('button').addEventListener('click',() => popup.close());
  popup.addEventListener('click',e => {
    if (e.target !== popup) return;
    const rect = popup.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) popup.close();
  });
  popup.addEventListener('close',() => {
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
  });
  window.addEventListener('message',e => {
    if (e.origin !== origin) return;
    if (inline.contentWindow !== e.source) return;
    let event = e.data;
    if (typeof event === 'string') {
      if (!event.includes('Tally.FormSubmitted')) return;
      try { event = JSON.parse(event); } catch { return; }
    }
    if (event?.event !== 'Tally.FormSubmitted' || event.payload?.formId !== ids[lang()]) return;
    subscribed = true;
    save(joinedKey,'1');
    stopAuto();
    sync();
  });
  sync();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      inlineLoaded = true;
      sync();
      observer.disconnect();
    },{rootMargin:'320px'});
    observer.observe(slot);
  } else { inlineLoaded = true; sync(); }
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  if (typeof popup.showModal === 'function' && new URLSearchParams(location.search).get('rad') === '1') openWheel();
  if (typeof popup.showModal === 'function' && !/^\/(?:en\/)?(?:contact|privacy|cookies|klachten|bedrijfsgegevens|voorwaarden)(?:\/|$)/.test(location.pathname)) {
    setTimeout(() => {readingTime = true;maybeInvite();},45000);
    window.addEventListener('scroll',maybeInvite,{passive:true});
  }
})();
