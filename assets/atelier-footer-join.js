(() => {
  const footer = document.querySelector('#atelier-foot.r2-foot');
  if (!footer) return;
  const inline = footer.querySelector('#newsletter');
  const dialog = footer.querySelector('#atelierpost-popup');
  const frames = [...footer.querySelectorAll('iframe')];
  const origin = 'https://tally.so';
  const forms = {nl:'7XNLlL', en:'bZWjVe'};
  const language = () => document.documentElement.lang.startsWith('en') ? 'en' : 'nl';
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const joinedKey = 'atelierpost.joined';
  const laterKey = 'atelierpost.nextInvitation';
  let joined = Boolean(read(joinedKey));
  let seen = false;
  let engaged = false;
  let nearFooter = false;

  let widget;
  function fitForms() {
    if (window.Tally?.loadEmbeds) { window.Tally.loadEmbeds(); return; }
    if (widget) return;
    widget = document.createElement('script');
    widget.src = origin + '/widgets/embed.js';
    widget.async = true;
    widget.addEventListener('load', () => window.Tally?.loadEmbeds());
    document.head.append(widget);
  }
  function load(frame) {
    const lang = language();
    const src = origin + '/embed/' + forms[lang] + '?hideTitle=1&alignLeft=1&transparentBackground=1&dynamicHeight=1';
    frame.title = lang === 'en' ? 'Sign up for Studio notes' : 'Inschrijven voor Atelierpost';
    if (frame.getAttribute('src') !== src) {
      frame.src = src;
      fitForms();
    }
  }
  function sync() {
    const en = language() === 'en';
    footer.querySelectorAll('[data-af-nl]').forEach(el => { el.textContent = en ? el.dataset.afEn : el.dataset.afNl; });
    dialog.querySelector('button').ariaLabel = en ? 'Close newsletter invitation' : 'Nieuwsbriefvenster sluiten';
    footer.querySelector('.r2-about nav').ariaLabel = en ? 'About the studio' : 'Over het atelier';
    frames.forEach(frame => { frame.hidden = joined; });
    footer.querySelectorAll('.af-confirm').forEach(el => { el.hidden = !joined; });
    if (!joined && nearFooter) load(frames[0]);
    if (!joined && dialog.open) load(frames[1]);
  }
  function open() {
    if (typeof dialog.showModal !== 'function') { inline.scrollIntoView(); return; }
    seen = true;
    dialog.showModal();
    if (!joined) load(frames[1]);
    save(laterKey, String(Date.now() + 7 * 86400000));
  }
  function invite() {
    if (!engaged || seen || read(joinedKey) || joined || Date.now() < Number(read(laterKey))) return;
    if (document.hidden || window.scrollY < innerHeight * .75 || footer.getBoundingClientRect().top < innerHeight) return;
    if (document.querySelector('dialog[open],#chat-panel:not([hidden])') || document.activeElement?.matches('input,textarea,select,iframe,[contenteditable="true"]')) return;
    open();
  }
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  window.addEventListener('message', event => {
    if (event.origin !== origin) return;
    const frame = frames.find(frame => frame.contentWindow === event.source);
    if (!frame) return;
    let data = event.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return; } }
    if (!data || typeof data !== 'object') return;
    if (data.event !== 'Tally.FormSubmitted' || data.payload?.formId !== forms[language()]) return;
    joined = true;
    save(joinedKey, '1');
    sync();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      nearFooter = true;
      sync();
      observer.disconnect();
    }, {rootMargin:'320px'});
    observer.observe(inline);
  } else nearFooter = true;
  new MutationObserver(sync).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  window.addEventListener('storage', event => {
    if (event.key === joinedKey) { joined = Boolean(read(joinedKey)); sync(); }
  });
  sync();
  const query = new URLSearchParams(location.search);
  if (query.get('atelierpost') === '1' || query.get('rad') === '1') open();
  else if (!/^\/(en\/)?(contact|privacy|cookies|klachten|bedrijfsgegevens|voorwaarden)(\/|$)/.test(location.pathname)) {
    setTimeout(() => { engaged = true; invite(); }, 45000);
    window.addEventListener('scroll', invite, {passive:true});
  }
})();
