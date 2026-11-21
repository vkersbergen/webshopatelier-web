(() => {
  const small = matchMedia('(max-width: 720px)');
  const tools = [...document.querySelectorAll('#tools:not([hidden]) .platform-groep')];
  function arrangeTools() {
    for (const group of tools) {
      const current = group.querySelector(':scope > .platform-disclosure');
      if (small.matches && !current) {
        const heading = group.querySelector('h3');
        if (!heading) continue;
        const disclosure = document.createElement('details');
        disclosure.className = 'platform-disclosure';
        const summary = document.createElement('summary');
        summary.append(heading);
        disclosure.append(summary, ...Array.from(group.childNodes));
        group.append(disclosure);
      } else if (!small.matches && current) {
        const summary = current.querySelector('summary');
        summary.replaceWith(...Array.from(summary.childNodes));
        current.replaceWith(...Array.from(current.childNodes));
      }
    }
  }
  arrangeTools();
  small.addEventListener('change', arrangeTools);

  const card = document.querySelector('#werk:not([hidden]) #case-inhoud');
  if (!card) return;
  const work = card.closest('#werk');
  let origin;
  let horizontal = false;

  function resetSwipe() {
    origin = null;
    horizontal = false;
    card.style.removeProperty('--swipe-offset');
  }

  card.addEventListener('touchstart', event => {
    resetSwipe();
    if (event.touches.length === 1) origin = event.touches[0];
  }, { passive: true });

  card.addEventListener('touchmove', event => {
    if (!origin || event.touches.length !== 1) return;
    const finger = event.touches[0];
    const dx = finger.clientX - origin.clientX;
    const dy = finger.clientY - origin.clientY;
    if (!horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dx) <= Math.abs(dy) * 1.2) return resetSwipe();
      horizontal = true;
    }
    if (event.cancelable) event.preventDefault();
    card.style.setProperty('--swipe-offset', Math.max(-32, Math.min(32, dx * .32)) + 'px');
  }, { passive: false });

  card.addEventListener('touchend', event => {
    if (!origin) return;
    const finger = event.changedTouches[0];
    const dx = finger.clientX - origin.clientX;
    const dy = finger.clientY - origin.clientY;
    if (!event.touches.length && Math.abs(dx) >= 32 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (event.cancelable) event.preventDefault();
      work.querySelector('[data-case-stap="' + (dx < 0 ? '1' : '-1') + '"]')?.click();
    }
    resetSwipe();
  }, { passive: false });
  card.addEventListener('touchcancel', resetSwipe, { passive: true });
})();
