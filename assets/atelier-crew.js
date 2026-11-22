(() => {
  const host = document.querySelector('.hero-visual[data-crew]');
  if (!host) return;

  // Depth rows. Neighbours are close enough to catch the same print, key or swatch.
  const rows = [
    ['groeistrategie', 'zoeken', 'website', 'copywriting', 'onboarding'],
    ['social', 'merkstrategie', 'teamassistent', 'productpaginas'],
    ['advertenties', 'advertentiebeleid', 'ai', 'onderhoud', 'conversie']
  ];
  const duets = [
    ['social', 'merkstrategie', 'print'],
    ['website', 'copywriting', 'proof'],
    ['onboarding', 'teamassistent', 'keys'],
    ['advertenties', 'advertentiebeleid', 'sound'],
    ['ai', 'onderhoud', 'pulse'],
    ['groeistrategie', 'zoeken', 'star'],
    ['productpaginas', 'conversie', 'tag']
  ];
  const sheets = '/assets/atelier-crew/acts/';
  const alphabet = rows.flat().sort();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const field = document.createElement('div');
  field.className = 'playfield';
  field.setAttribute('aria-hidden', 'true');
  const actors = new Map();
  rows.forEach((roles, row) => {
    const tier = document.createElement('div');
    tier.className = 'crew-tier tier-' + row;
    roles.forEach((role, index) => {
      const el = document.createElement('span');
      const slot = alphabet.indexOf(role);
      el.className = 'wa-mini-agent';
      el.dataset.role = role;
      el.style.setProperty('--rest-x', (slot % 7) * 100 / 6 + '%');
      el.style.setProperty('--rest-y', Math.floor(slot / 7) * 100 + '%');
      el.style.setProperty('--seat', ((index + .5) / roles.length * 100) + '%');
      const drawing = document.createElement('i');
      drawing.className = 'agent-puppet';
      el.append(drawing);
      tier.append(el);
      actors.set(role, { el, drawing, frame: -1, image: null });
    });
    field.append(tier);
  });
  const token = document.createElement('i');
  token.className = 'crew-handoff';
  field.append(token);
  host.append(field);

  const control = host.querySelector('.crew-motion');
  let paused = false, visible = false, clock = 0, previous = 0, request = 0;
  let scene = null, sequence = 0, startAfter = .35;

  function load(role) {
    const actor = actors.get(role);
    if (actor.image) return;
    actor.image = new Image();
    actor.image.src = sheets + role + '.webp';
  }
  function pose(role, frame) {
    const actor = actors.get(role);
    if (frame === actor.frame) return;
    if (frame < 1 || frame >= 23) {
      actor.drawing.removeAttribute('style');
      actor.frame = 0;
      return;
    }
    if (!actor.image?.naturalWidth) return;
    actor.frame = frame;
    actor.drawing.style.backgroundImage = 'url(' + actor.image.src + ')';
    actor.drawing.style.backgroundSize = '600% 400%';
    actor.drawing.style.backgroundPosition = (frame % 6 * 20) + '% ' + (Math.floor(frame / 6) * 100 / 3) + '%';
  }
  function reset() {
    if (scene) {
      pose(scene.pair[0], 0);
      pose(scene.pair[1], 0);
    }
    scene = null;
    token.hidden = true;
  }
  function begin(pair, selected) {
    reset();
    const [a, b, prop] = pair;
    const ordered = selected === b ? [b, a, prop] : pair;
    load(ordered[0]);
    load(ordered[1]);
    scene = { pair: ordered, start: clock };
    field.dataset.scene = ordered.slice(0, 2).join('-');
    token.dataset.prop = prop;
    positionToken();
  }
  function hand(role) {
    const bounds = actors.get(role).el.getBoundingClientRect(), parent = field.getBoundingClientRect();
    return { x: bounds.left - parent.left + bounds.width * .61, y: bounds.top - parent.top + bounds.height * .57 };
  }
  function positionToken() {
    if (!scene) return;
    scene.from = hand(scene.pair[0]);
    scene.to = hand(scene.pair[1]);
  }
  function draw() {
    if (!scene && clock >= startAfter) {
      begin(duets[sequence++ % duets.length]);
    }
    if (!scene) return;
    const [lead, partner] = scene.pair;
    const age = clock - scene.start;
    const currentFrame = t => Math.max(0, Math.min(23, Math.floor(t * 12)));
    pose(lead, currentFrame(age));
    pose(partner, currentFrame(age - .92));
    const t = (age - .77) / .82;
    token.hidden = !(t >= 0 && t <= 1);
    if (!token.hidden) {
      const { from, to } = scene;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t - Math.sin(Math.PI * t) * Math.min(24,field.clientHeight*.08);
      token.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + (40 * Math.sin(t * Math.PI)) + 'deg)';
      token.style.opacity = Math.min(1, t * 8, (1 - t) * 8);
    }
    if (age >= 2.85) {
      reset();
      startAfter = clock + .65;
      duets[sequence % duets.length].slice(0, 2).forEach(load);
    }
  }
  function frame(now) {
    if (previous) clock += Math.min((now - previous) / 1000, .12);
    previous = now;
    draw();
    request = requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(request);
    previous = 0;
    if (reduce.matches) reset();
    if (visible && !paused && !document.hidden && !reduce.matches) {
      duets[sequence % duets.length].slice(0, 2).forEach(load);
      request = requestAnimationFrame(frame);
    }
  }
  function replay(event) {
    const el = event.target.closest('.wa-mini-agent');
    if (!el || paused || reduce.matches) return;
    const pair = duets.find(p => p[0] === el.dataset.role || p[1] === el.dataset.role);
    if (pair) begin(pair, el.dataset.role);
  }
  field.addEventListener('click', replay);
  function label() {
    const en = document.documentElement.lang.startsWith('en');
    const title = paused ? (en ? 'Resume animation' : 'Animatie hervatten') : (en ? 'Pause animation' : 'Animatie pauzeren');
    control.setAttribute('aria-label', title);
    control.title = title;
  }
  control.addEventListener('click', () => {
    paused = !paused;
    control.setAttribute('aria-pressed', String(paused));
    label();
    sync();
  });
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(field);
  new ResizeObserver(positionToken).observe(field);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
  token.hidden = true;
  label();
})();
