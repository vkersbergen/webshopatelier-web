(() => {
  const footer = document.getElementById('atelier-foot');
  const slot = footer?.querySelector('#newsletter');
  if (!slot) return;

  const popup = footer.querySelector('.af-popup');
  const inline = slot.querySelector('iframe');
  const popupFrame = popup.querySelector('iframe');
  const frames = [inline,popupFrame];
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
    if (popup.open) load(popupFrame);
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
    prompted = true;
    stopAuto();
    previousFocus = document.activeElement;
    load(popupFrame);
    popup.showModal();
    save(laterKey,String(Date.now()+week));
  }
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
    const frame = frames.find(f => f.contentWindow === e.source);
    if (!frame) return;
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
  if (typeof popup.showModal === 'function' && !/^\/(?:en\/)?(?:contact|privacy|cookies|klachten|bedrijfsgegevens|voorwaarden)(?:\/|$)/.test(location.pathname)) {
    setTimeout(() => {readingTime = true;maybeInvite();},45000);
    window.addEventListener('scroll',maybeInvite,{passive:true});
  }
})();
