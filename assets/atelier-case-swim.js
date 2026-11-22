/* Articulated cutouts use the same glass and highlights as their original stills. */
(() => {
  const cases = document.querySelector('#werk');
  const lane = document.querySelector('.atelier-zwembaan');
  if (!cases && !lane) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const actors = new Set();
  const visible = new WeakSet();
  let serial = 0;

  function stop(actor) {
    actor.classList.remove('puppet-intro', 'puppet-react');
  }
  function play(actor, reaction = false, reverse = false) {
    if (!actor || !visible.has(actor) || document.hidden || reduce.matches) return;
    stop(actor);
    actor.style.setProperty('--puppet-turn', reverse ? '-1' : '1');
    // A new case can arrive before the previous glance has finished.
    actor.getBoundingClientRect();
    actor.classList.add(reaction ? 'puppet-react' : 'puppet-intro');
  }
  const observer = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.intersectionRatio >= .55) {
        visible.add(e.target);
        play(e.target, e.target.dataset.arriving === 'yes');
        delete e.target.dataset.arriving;
      } else {
        visible.delete(e.target);
        stop(e.target);
      }
    }
  }, { threshold: [0, .55] });

  const phoneParts = {
    head: 'M0 0H140V68Q132 93 117 104L83 109 69 120Q21 124 5 90L0 77Z',
    seated: 'M25 109Q48 125 93 113L100 146 118 163 103 163Q128 183 130 214L130 262H35V210L5 194 0 154Z',
    grip: 'M70 110L137 103 143 122Q153 124 150 140Q147 159 122 164L104 155 88 149Q61 162 32 159L24 143 38 133 55 124 68 123Z',
    thumb: 'M58 133Q61 122 73 122Q86 123 87 134Q87 146 74 151Q60 152 55 145Z'
  };
  const swimParts = {
    head: 'M117 0H248V76Q239 95 213 102Q178 109 152 91L143 90Q118 91 115 72Z',
    body: 'M68 69Q97 58 131 67L160 82Q171 97 189 93L179 117Q148 140 116 142Q84 146 72 133L57 132 63 102 79 99Z',
    lead: 'M148 97Q171 96 187 90Q214 90 250 80Q263 69 276 74Q287 82 282 94Q280 101 267 102L256 101Q211 115 173 116L157 119Z',
    finFar: 'M0 78Q24 75 43 87L78 86 90 99 79 113 36 110 0 119Z',
    finNear: 'M0 113L41 109 83 100Q98 99 103 114L89 134 45 136 1 150Z'
  };

  function makeActor(type) {
    const swimming = type === 'swimmer';
    const sizes = swimming ? [288,146] : [150,262];
    const parts = swimming ? swimParts : phoneParts;
    const key = 'acs' + (++serial);
    const asset = '/assets/atelier-scenes/' + (swimming ? 'zwemmer' : 'telefoon') + '.webp';
    const clipDefs = Object.entries(parts).map(([part, outline]) =>
      '<clipPath id="'+key+part+'"><path d="'+outline+'"/></clipPath>').join('');
    const plate = part => '<g clip-path="url(#'+key+part+')"><use href="#'+key+'-art"/></g>';
    const part = (name, className = name) => '<g class="puppet-'+className+'">'+plate(name)+'</g>';
    // The zero has a rear and a front half, so it actually wraps around the waist.
    const ring = front => '<g class="puppet-ring"><g transform="rotate(18 140 102)"><path d="M140 66 A16 36 0 0 '+(front?'1':'0')+' 140 138" fill="none" stroke="#683449" stroke-width="9"/><path d="M140 66 A16 36 0 0 '+(front?'1':'0')+' 140 138" fill="none" stroke="url(#'+key+'-coral)" stroke-width="5"/></g></g>';
    const content = swimming
      ? ring(false)+part('lead','rear-arm')+part('finFar')+part('finNear')+part('body')+part('head')+part('lead','reach')+ring(true)+
        '<g class="puppet-bubbles" fill="none" stroke="#ffc0a4" stroke-width="2"><ellipse cx="239" cy="45" rx="3" ry="5"/><ellipse cx="245" cy="30" rx="4" ry="7"/><path d="M253 20l4-3v10"/></g>'
      : part('seated')+part('head')+part('grip')+part('thumb');
    const actor = document.createElement('span');
    actor.className = 'case-puppet case-puppet--'+type;
    actor.setAttribute('aria-hidden','true');
    actor.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 '+sizes.join(' ')+'" xmlns="http://www.w3.org/2000/svg"><defs><image id="'+key+'-art" href="'+asset+'" width="'+sizes[0]+'" height="'+sizes[1]+'"/>'+clipDefs+'<linearGradient id="'+key+'-coral"><stop stop-color="#ffb29a"/><stop offset=".55" stop-color="#cd685f"/><stop offset="1" stop-color="#ffc7a8"/></linearGradient></defs>'+content+'</svg>';
    actors.add(actor);
    observer.observe(actor);
    return actor;
  }
  if (lane) lane.append(makeActor('swimmer'));
  const mountPhones = () => {
    for (const host of cases.querySelectorAll('.macbook:has(.atelier-speler-telefoon), .wa-mobile .desktop-device')) {
      if (!host.querySelector('.case-puppet')) host.append(makeActor('phone'));
    }
  };
  if (cases) {
    mountPhones();
    let last = cases.querySelector('[data-case][aria-pressed="true"]')?.dataset.case;
    const tabChanges = new MutationObserver(() => {
      const selected = cases.querySelector('[data-case][aria-pressed="true"]')?.dataset.case;
      if (selected !== last) play(cases.querySelector('.macbook .case-puppet'), true, Number(selected)<Number(last));
      last = selected;
    });
    cases.querySelectorAll('[data-case]').forEach(tab => tabChanges.observe(tab,{attributes:true,attributeFilter:['aria-pressed']}));
    // A mobile carousel selects its slide by scrolling (touch, buttons or keyboard).
    const slideIndex = new WeakMap();
    cases.addEventListener('scroll', event => {
      const rail = event.target;
      if (!rail.matches?.('.wa-mobile .rail')) return;
      const slides = [...rail.children];
      const index = slides.reduce((best,el,i) => Math.abs(el.offsetLeft-slides[0].offsetLeft-rail.scrollLeft) < Math.abs(slides[best].offsetLeft-slides[0].offsetLeft-rail.scrollLeft) ? i : best,0);
      const prev = slideIndex.get(rail) ?? 0;
      if (prev === index) return;
      slideIndex.set(rail,index);
      const actor = slides[index].querySelector('.case-puppet');
      if (!actor) return;
      if (visible.has(actor)) play(actor,true,index<prev);
      else actor.dataset.arriving = 'yes';
    }, {capture:true,passive:true});
    const mobileMount = new MutationObserver(records => {
      if (records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1 && (n.matches('.wa-mobile,.desktop-device') || n.querySelector('.desktop-device'))))) mountPhones();
      for (const actor of actors) if (!actor.isConnected) {
        observer.unobserve(actor);
        actors.delete(actor);
      }
    });
    mobileMount.observe(cases,{childList:true,subtree:true});
  }
  function reset() {
    for (const actor of actors) {
      if (document.hidden || reduce.matches) stop(actor);
      else if (visible.has(actor)) play(actor);
    }
  }
  document.addEventListener('visibilitychange',reset);
  reduce.addEventListener('change',reset);
})();
