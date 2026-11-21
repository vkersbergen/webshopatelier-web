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

  const work = document.querySelector('#werk:not([hidden])');
  const stage = work?.querySelector('.case-stage');
  if (!stage) return;
  let start;
  stage.addEventListener('pointerdown', event => {
    if (!small.matches || !event.isPrimary || event.pointerType !== 'touch') return;
    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointercancel', () => { start = null; });
  stage.addEventListener('pointerup', event => {
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      work.querySelector('[data-case-stap="' + (dx < 0 ? '1' : '-1') + '"]')?.click();
    }
  });
})();
