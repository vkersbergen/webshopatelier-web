(() => {
  const stage = document.querySelector('.crew-cinema');
  if (!stage) return;
  const film = stage.querySelector('video');
  const control = stage.parentElement.querySelector('.crew-motion');
  const compact = matchMedia('(max-width: 899px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = !reduced.matches;
  let visible = false;
  let request = 0;
  let interrupted = false;

  function label() {
    const english = document.documentElement.lang.startsWith('en');
    const playing = enabled && !interrupted;
    const title = playing
      ? (english ? 'Pause animation' : 'Animatie pauzeren')
      : (english ? 'Play animation' : 'Animatie afspelen');
    control.setAttribute('aria-pressed', String(!playing));
    control.setAttribute('aria-label', title);
    control.title = title;
  }

  function sync() {
    const id = ++request;
    if (!enabled || !visible || document.hidden || interrupted) {
      film.pause();
      label();
      return;
    }
    const filename = compact.matches ? 'atelier-vlucht-mobiel' : 'atelier-vlucht';
    const src = '/assets/atelier-crew/film/' + filename + '.mp4?v=glas2';
    if (film.getAttribute('src') !== src) {
      stage.classList.remove('is-playing');
      film.src = src;
    }
    film.play().catch(() => {
      if (id !== request) return;
      interrupted = true;
      label();
    });
    label();
  }

  film.addEventListener('playing', () => stage.classList.add('is-playing'));
  film.addEventListener('error', () => {
    stage.classList.remove('is-playing');
    interrupted = true;
    label();
  });
  control.addEventListener('click', () => {
    enabled = !enabled || interrupted;
    if (film.error) film.removeAttribute('src');
    interrupted = false;
    sync();
  });
  compact.addEventListener('change', sync);
  reduced.addEventListener('change', () => {
    enabled = !reduced.matches;
    interrupted = false;
    sync();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= .1;
    sync();
  }, { threshold: [0, .1] }).observe(stage);
  document.addEventListener('visibilitychange', sync);
  new MutationObserver(label).observe(document.documentElement, {
    attributes: true, attributeFilter: ['lang']
  });
  control.hidden = false;
  label();
})();
