(() => {
  const stage = document.querySelector('.crew-cinema');
  if (!stage) return;
  const film = stage.querySelector('video');
  const compact = matchMedia('(max-width: 899px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let request = 0;

  function showPoster() {
    stage.classList.remove('is-playing');
  }

  function sync() {
    const id = ++request;
    if (!visible || document.hidden || reduced.matches) {
      film.pause();
      if (reduced.matches) showPoster();
      return;
    }
    const filename = compact.matches ? 'atelier-vlucht-mobiel' : 'atelier-vlucht';
    const src = '/assets/atelier-crew/film/' + filename + '.mp4?v=veertien1';
    if (film.getAttribute('src') !== src) {
      showPoster();
      film.src = src;
    }
    film.play().catch(() => {
      if (request === id) showPoster();
    });
  }

  film.addEventListener('playing', () => {
    if (!reduced.matches) stage.classList.add('is-playing');
  });
  film.addEventListener('error', showPoster);
  compact.addEventListener('change', sync);
  reduced.addEventListener('change', sync);
  new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= .1;
    sync();
  }, { threshold: [0, .1] }).observe(stage);
  document.addEventListener('visibilitychange', sync);
})();
