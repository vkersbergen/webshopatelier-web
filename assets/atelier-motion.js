/* Atelier motion is progressive: primary text and controls are present before any animation. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.querySelector('main');
  if (!root) return;
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      if (reduced.matches || target.matches(':focus-within')) continue;
      const kind = target.dataset.atelierMotion;
      const start = {
        photograph: { clipPath: 'inset(0 0 8% 0 round 6px)', translate: '0 9px' },
        card: { opacity: .6, translate: '0 12px' },
        heading: { opacity: .75, translate: '0 9px' },
        step: { opacity: .66, translate: '-8px 0' }
      }[kind];
      const end = kind === 'photograph' ? { clipPath: 'inset(0 0 0 0 round 6px)', translate: '0 0' } : { opacity: 1, translate: '0 0' };
      const entry = target.animate([start, end], {
        duration: kind === 'photograph' ? 540 : 360,
        delay: Number(target.dataset.atelierDelay || 0),
        easing: 'cubic-bezier(.18,.7,.2,1)'
      });
      target.addEventListener('focusin', () => entry.cancel(), {once: true});
      target.dataset.atelierEntered = '';
    }
  }, {threshold: .08});
  function register(element, kind, index = 0) {
    if (!element || element.dataset.atelierMotion) return;
    element.dataset.atelierMotion = kind;
    if (index) element.dataset.atelierDelay = String((index % 3) * 38);
    observer.observe(element);
  }
  // The hero lettering, logo belt and crossed-out checklist already have their own motion.
  const zones = [...root.querySelectorAll('section'), ...document.querySelectorAll('footer .foot-news,footer .foot-directory')];
  if (!zones.length) zones.push(root);
  for (const section of zones) {
    if (section.matches('.hero,.reel,.ontzorg')) continue;
    const title = section.querySelector('h1,h2,h3');
    register(title, 'heading');
    if (!title) register(section.firstElementChild, 'step');
  }
  root.querySelectorAll('.commerce-feature-fotolink,.case-stage,.story-portrait,.commerce-hero figure,.pakket-detail figure,.afdeling > img').forEach(e => register(e, 'photograph'));
  root.querySelectorAll('.service-grid > article,.artikel-raster > article,.platform-groepen > *,.pakket-suggesties article,.book-card,.pakket-opties details,.org-band a,.team-details .rol,.vaardigheden-band details').forEach((e,i) => register(e,'card',i));
  root.querySelectorAll('.aanpak-stappen > li,.juridisch-onderdeel > h3,.atelier-call-actions,.contact-paneel,.vragen details').forEach((e,i) => register(e,'step',i));
  if (root.children.length && !root.querySelector('section')) {
    root.querySelectorAll('p,h2,li').forEach((e,i)=>register(e,'step',i));
  }
  const figure = document.querySelector('.foot-mark img');
  if (figure) {
    const signature = document.createElement('button');
    signature.className = 'atelier-signature';
    signature.type = 'button';
    signature.setAttribute('aria-label', 'Speel met het atelierlogo / Play with the studio mark');
    figure.replaceWith(signature);
    signature.append(figure);
    signature.addEventListener('click', () => {
      if (reduced.matches || signature.querySelector('.atelier-spark')) return;
      figure.animate([{rotate:'0deg'},{rotate:'-8deg',offset:.3},{rotate:'5deg',offset:.67},{rotate:'0deg'}],{duration:470});
      [-34,-16,12,32].forEach((x,i)=>{
        const piece=document.createElement('i');
        piece.className='atelier-spark';
        piece.ariaHidden='true';
        signature.append(piece);
        piece.animate([{transform:'translate(-50%, -50%) scale(.35)',opacity:.6},
          {transform:'translate('+x+'px, '+(-24-i*4)+'px) rotate('+(i*26)+'deg)',opacity:1,offset:.52},
          {transform:'translate('+(x*1.35)+'px, 8px) rotate('+(i*43)+'deg) scale(.4)',opacity:0}],
          {duration:650,easing:'ease-out'}).onfinish=()=>piece.remove();
      });
    });
  }
})();

// Give the booking and email controls the bottom-right corner when they pass behind the assistant.
(() => {
  const launcher = document.querySelector('.chat-launch');
  if (!launcher) return;
  const controls = document.querySelectorAll('.atelier-call-actions a,#newsletter button');
  let observer;
  function watchCorner() {
    observer?.disconnect();
    document.body.classList.remove('atelier-vrije-actie');
    if (innerWidth > 700) return;
    const engaged = new Set();
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) engaged.add(entry.target);
        else engaged.delete(entry.target);
      }
      document.body.classList.toggle('atelier-vrije-actie',engaged.size>0);
    }, {rootMargin: (90-innerHeight)+'px 0px 0px '+(90-innerWidth)+'px'});
    controls.forEach(control => observer.observe(control));
  }
  watchCorner();
  addEventListener('resize', watchCorner, {passive:true});
})();
/* Shared title typography */
/* Extend the studio's scroll typography to service pages, articles and Commerce.
   Highlight ranges preserve the original selection, semantic text, translations and link names. */
(() => {
  const headings = [...document.querySelectorAll('main h2')].filter(h => !h.closest('dialog,[role="dialog"]'));
  if (!headings.length) return;
  const captions = new Map([
    ['Wat is mogelijk?', 'What are the options?'],
    ['Bespreek jouw pakket.', 'Discuss your package.']
  ]);
  for (const h of headings) {
    if (h.closest('.pakket-detail-band,.pakket-slot') && captions.has(h.textContent.trim())) {
      h.dataset.atelierTitleNl = h.textContent.trim();
    }
  }
  function translateServiceTitles() {
    for (const h of headings.filter(h => h.dataset.atelierTitleNl)) {
      const nl = h.dataset.atelierTitleNl;
      const text = document.documentElement.lang.startsWith('en') ? captions.get(nl) : nl;
      if (h.textContent !== text) h.textContent = text;
    }
  }
  translateServiceTitles();
  new MutationObserver(translateServiceTitles).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  if (!window.CSS?.highlights || typeof Highlight !== 'function') return;
  // Existing data-reveal headings are animated by the site's original tekenTitels handler.
  const target = headings.filter(h => !h.hasAttribute('data-reveal'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const entries = new Map();
  const grey = [154,143,165], white = [249,244,239], coral = [255,112,78];
  const clamp = value => Math.min(1,Math.max(0,value));
  const mix = (a,b,p) => a.map((v,i)=>Math.round(v+(b[i]-v)*p));
  const rules = document.createElement('style');
  document.head.append(rules);
  const sheet = rules.sheet;
  let next = 0, frame = 0;
  function ranges(h) {
    for (const word of entries.get(h)||[]) CSS.highlights.delete(word.key);
    const it=document.createTreeWalker(h,NodeFilter.SHOW_TEXT), words=[];
    let node;
    while(node=it.nextNode()) {
      for(const m of node.data.matchAll(/\S+/gu)) {
        const range = new Range();
        range.setStart(node,m.index);range.setEnd(node,m.index+m[0].length);
        const index=words.length,key='atelier-title-'+h.dataset.inkId+'-'+index;
        const highlight=new Highlight(range);CSS.highlights.set(key,highlight);
        words.push({key});
      }
    }
    for(const word of words){
      let rule=Array.from(sheet.cssRules).find(r=>r.selectorText==='::highlight('+word.key+')');
      if(!rule){const pos=sheet.insertRule('::highlight('+word.key+'){color:inherit}',sheet.cssRules.length);rule=sheet.cssRules[pos]}
      word.rule=rule;
    }
    entries.set(h,words);
  }
  function paint(){
    frame=0;
    for(const [h,words] of entries){
      const rect=h.getBoundingClientRect();
      if(!rect.width||!rect.height)continue;
      const progress=clamp((innerHeight*.94-rect.top)/(innerHeight*.63));
      for(const [i,word] of words.entries()){
        const last=i===words.length-1;
        const delay=i/Math.max(words.length-1,1)*.14;
        const base=mix(grey,white,clamp((progress-delay)/.56));
        const rgb=reduced.matches?(last?coral:white):(last?mix(base,coral,clamp((progress-.72)/.28)):base);
        const color=forced.matches?'CanvasText':'rgb('+rgb.join(',')+')';
        if(word.color!==color){word.color=color;word.rule.style.color=color}
      }
    }
  }
  function queue(){if(!frame)frame=requestAnimationFrame(paint)}
  for(const h of target){
    h.dataset.inkId=String(next++);ranges(h);
    new MutationObserver(()=>{ranges(h);queue()}).observe(h,{subtree:true,characterData:true,childList:true});
  }
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);
  reduced.addEventListener('change',queue);forced.addEventListener('change',queue);
  document.addEventListener('toggle',queue,true);
  paint();
})();

;(() => {
  function updateImageLanguage() {
    const english = document.documentElement.lang.startsWith('en');
    document.querySelectorAll('img[data-alt-en]').forEach(image => {
      image.alt = english ? image.dataset.altEn : image.dataset.altNl;
    });
  }
  updateImageLanguage();
  new MutationObserver(updateImageLanguage).observe(document.documentElement, {
    attributes: true, attributeFilter: ['lang']
  });
})();
