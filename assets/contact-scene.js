(() => {
  const hero = document.querySelector('.contact-hero');
  if (!hero) return;
  const scene = hero.querySelector('.contact-motion');
  const hover = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  function reset() {
    scene.style.removeProperty('--scene-shift-x');
    scene.style.removeProperty('--scene-shift-y');
  }
  hero.addEventListener('pointermove', event => {
    if (!hover.matches || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    scene.style.setProperty('--scene-shift-x', (x * 46).toFixed(1) + 'px');
    scene.style.setProperty('--scene-shift-y', (y * 30).toFixed(1) + 'px');
  }, {passive:true});
  hero.addEventListener('pointerleave', reset);
  hover.addEventListener('change', reset);
})();
