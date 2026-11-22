(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finishOnPreference = new Set();
  const resumeOnPreference = new Set();
  const ns = 'http://www.w3.org/2000/svg';
  const svgElement = (name, attrs = {}) => {
    const element = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    return element;
  };

  // Each layer samples the same original photograph. The foreground plate includes both hands.
  function timekeeper(image, index) {
    const card = image.closest('.atelier-call-card');
    const picker = card?.querySelector('.booking-picker');
    if (!picker) return;
    const svg = svgElement('svg', {viewBox:'0 0 400 400', class:'atelier-clock reader-clock', 'aria-hidden':'true', focusable:'false'});
    const id = 'wa-dial-' + index;
    svg.innerHTML = `<defs>
      <image id="${id}-plate" href="/assets/atelier-tijdmeester.webp" width="400" height="400"/>
      <clipPath id="${id}-head"><path d="M 0 0 H 256 V 159 Q 223 158 201 196 L 196 226 Q 176 248 109 244 L 30 235 Z"/></clipPath>
      <clipPath id="${id}-body"><path d="M 100 241 Q 141 247 182 230 L 211 220 V 288 L 248 301 V 400 H 75 Z"/></clipPath>
      <clipPath id="${id}-clock"><path d="M 195 225 Q 196 172 247 158 Q 292 145 320 174 Q 348 171 354 203 L 344 237 Q 342 282 306 299 Q 260 315 222 298 Q 180 310 147 286 Q 113 275 116 252 Q 119 238 137 243 L 187 269 L 205 264 Z"/></clipPath>
      <radialGradient id="${id}-face"><stop stop-color="#fff1d1"/><stop offset="1" stop-color="#fee7c8"/></radialGradient>
    </defs>
    <use href="#${id}-plate" clip-path="url(#${id}-body)"/>
    <g class="timekeeper-head"><use href="#${id}-plate" clip-path="url(#${id}-head)"/></g>
    <g class="timekeeper-clock"><use href="#${id}-plate" clip-path="url(#${id}-clock)"/>
      <ellipse cx="269" cy="229" rx="56" ry="56" fill="url(#${id}-face)"/>
      <g stroke="#59313a" stroke-width="3" stroke-linecap="round">${Array.from({length:12}, (_,n)=>'<path transform="rotate('+n*30+' 269 229)" d="M269 177v6"/>').join('')}</g>
      <path class="timekeeper-hour" d="M269 229v-31" stroke="#492333" stroke-width="7" stroke-linecap="round"/>
      <path class="timekeeper-minute" d="M269 229v-46" stroke="#492333" stroke-width="5" stroke-linecap="round"/>
      <circle cx="269" cy="229" r="6.6" fill="#582a3b"/>
    </g>`;
    const hourHand = svg.querySelector('.timekeeper-hour');
    const minuteHand = svg.querySelector('.timekeeper-minute');
    const head = svg.querySelector('.timekeeper-head');
    const arms = svg.querySelector('.timekeeper-clock');
    const stop = () => svg.getAnimations({subtree:true}).forEach(a=>a.cancel());
    finishOnPreference.add(stop);
    let hourAngle = 300, minuteAngle = 60;
    const nearest = (current, target) => current + ((target-current+540)%360+360)%360-180;
    const select = (animate = false) => {
      const button = picker.querySelector('.booking-times [aria-pressed="true"]');
      const [, hours, minutes] = button?.textContent.trim().match(/^(\d\d?):(\d\d)$/) || [];
      if (!hours) return;
      const oldHour = hourAngle, oldMinute = minuteAngle;
      hourAngle = nearest(hourAngle, Number(hours)%12*30 + Number(minutes)/2);
      minuteAngle = nearest(minuteAngle, Number(minutes)*6);
      hourHand.style.transform = 'rotate('+hourAngle+'deg)';
      minuteHand.style.transform = 'rotate('+minuteAngle+'deg)';
      if (!animate) return;
      stop();
      if (reduced.matches || document.hidden) return;
      const options = {duration:1300,easing:'ease-in-out'};
      head.animate([{transform:'rotate(0)'},{transform:'rotate(10deg)',offset:.32},{transform:'rotate(8deg)',offset:.56},{transform:'rotate(-5deg)',offset:.7},{transform:'rotate(4deg)',offset:.84},{transform:'rotate(0)'}],options);
      arms.animate([{transform:'rotate(0)'},{transform:'rotate(-8deg)',offset:.26},{transform:'rotate(-8deg)',offset:.63},{transform:'rotate(1deg)',offset:.87},{transform:'rotate(0)'}],options);
      for (const [hand, from, to] of [[hourHand,oldHour,hourAngle],[minuteHand,oldMinute,minuteAngle]]) {
        hand.animate([{transform:'rotate('+from+'deg)'},{transform:'rotate('+to+'deg)'}],{duration:610,easing:'ease-out'});
      }
    };
    image.replaceWith(svg);
    new IntersectionObserver(([entry]) => svg.classList.toggle('clock-in-view', entry.isIntersecting)).observe(svg);
    hourHand.style.transform='rotate(300deg)';
    minuteHand.style.transform='rotate(60deg)';
    select();
    // The picker replaces the buttons on every selection, including keyboard activation.
    picker.addEventListener('click', e => {
      if (e.composedPath().some(el=>el.classList?.contains('booking-times') || el.classList?.contains('booking-days'))) select(true);
    });
    new MutationObserver(()=>select()).observe(picker,{childList:true,subtree:true});
  }
  document.querySelectorAll('img.atelier-clock').forEach(timekeeper);

  const paper = 'M4 2h19l5 5v23H4z M23 2v6h5';
  const profiles = {
    website:['website', [paper,'M7 12h6m2 0h9M7 17h6m2 0h9','M7 22h17']],
    webshop:['productpaginas', ['M6 2l3 2 3-2 3 2 3-2 3 2 4-2v27l-4-2-3 2-3-2-3 2-3-2-3 2z','M9 9h11m-11 5h14m-14 5h10','M10 23h10']],
    ai:['zoeken', ['M3 4h23v16H13l-6 4v-4H3z','M8 10h11m-11 4h8','M20 25l3 3 6-8']],
    'seo-geo':['zoeken',['M2 3h12v23H2zM17 3h12v16h-6l-5 4v-4h-1z','M5 9h6m-6 5h6m-6 5h5','M20 10h6m-6 4h4']],
    'social-kosten':['social',[paper,'M8 15V9h13v6zM8 23v-5h5v5zm8 0v-5h5v5z','M23 13l6-3v9l-6-3z']],
    'meta-budget':['advertenties',['M3 7h26M3 16h26M3 25h26','M10 4v6m12 3v6m-13 3v6','M18 13v6']],
    'ai-agent':['teamassistent',['M1 16h12v11H1zM18 16h12v11H18z','M9 8h10m-5 0v6','M5 4h8v7H5z']],
    'chatbot-kosten':['teamassistent',['M2 3h22v15H11l-6 4v-4H2z','M8 8h10m-10 5h7','M18 23h10m-10 4h8']],
    'website-onderhoud':['onderhoud',['M1 4h28v19H1zM10 28h10m-5-5v5','M3 10h24','M10 16l4 4 7-8']],
    'webshop-conversie':['conversie',['M2 4h28l-9 9H11zM12 17h8l-3 4v6l-3 2v-8z','M5 7h20','M22 23l3 2 5-6']],
    checkout:['productpaginas',['M8 2h16v27H8z','M11 6h10m-10 18h10','M11 17l3 3 7-8']],
    'nieuwe-markt':['groeistrategie',['M2 6l8-4 10 4 10-4v23l-10 5-10-5-8 4zM10 2v23m10-19v24','M5 17l2-3m6 2 3-1','M20 12l3 3 5-7']]
  };
  function reader(actor, slug) {
    const [role,paths] = profiles[slug] || [];
    if (!role) return;
    const puppet = document.createElement('span');
    puppet.className='reader-puppet';
    const prop = svgElement('svg',{viewBox:'0 0 32 32',class:'reader-object','aria-hidden':'true'});
    paths.forEach((d,index)=>prop.append(svgElement('path',{d,class:index===2?'reader-detail':''})));
    const sheet = new Image();
    const src='/assets/atelier-crew/acts/'+role+'.webp';
    let ready=false,visible=false,loading=false;
    const stop=()=> actor.getAnimations({subtree:true}).forEach(a=>a.cancel());
    finishOnPreference.add(stop);
    function perform() {
      if (!ready || !visible || document.hidden || reduced.matches || puppet.getAnimations().length) return;
      const frames=Array.from({length:24},(_,i)=>({backgroundPosition:(i%6*20)+'% '+(Math.floor(i/6)*100/3)+'%',offset:i/23,easing:'steps(1,end)'}));
      puppet.animate(frames,{duration:2250,iterations:Infinity});
      prop.animate([{transform:'rotate(-6deg)'},{transform:'rotate(-6deg)',offset:.2},{transform:'translate(-2px,-2px) rotate(7deg)',offset:.47},{transform:'rotate(2deg)',offset:.72},{transform:'rotate(-6deg)'}],{duration:2250,iterations:Infinity});
      prop.lastChild.animate([{opacity:.45},{opacity:.45,offset:.43},{opacity:1,offset:.53},{opacity:1}],{duration:2250,iterations:Infinity});
    }
    resumeOnPreference.add(perform);
    new IntersectionObserver(async ([entry])=>{
      visible=entry.isIntersecting;
      if (!visible) {stop();return;}
      if (!ready && !loading) {
        loading=true;
        sheet.src=src;
        try {await sheet.decode();} catch {loading=false;return;}
        puppet.style.backgroundImage='url("'+src+'")';
        actor.append(puppet,prop);
        actor.classList.add('reader-articulated');
        ready=true;
      }
      perform();
    },{threshold:.4}).observe(actor);
    actor.closest('.cameo-photo')?.addEventListener('click', perform);
  }
  document.querySelectorAll('.cameo-reader').forEach(actor=>reader(actor,location.pathname.split('/')[2]));
  const stopAll=()=>finishOnPreference.forEach(stop=>stop());
  function syncMotion() {
    if (reduced.matches || document.hidden) stopAll();
    else resumeOnPreference.forEach(perform => perform());
  }
  reduced.addEventListener('change',syncMotion);
  document.addEventListener('visibilitychange',syncMotion);
})();
