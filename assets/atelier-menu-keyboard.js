(() => {
  const panel = document.getElementById('mega');
  const mobile = document.getElementById('menu');
  const desktop = document.getElementById('mega-trigger');
  if (!panel || !mobile || !desktop) return;

  const selectors = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]';
  const stops = root => [...root.querySelectorAll(selectors)].filter(el => el.tabIndex >= 0 && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  let opener;
  for (const trigger of [desktop, mobile]) {
    trigger.addEventListener('click', () => { opener = trigger; }, true);
    trigger.addEventListener('keydown', () => { opener = trigger; });
  }
  function close() {
    if (!panel.hidden) mobile.click();
  }
  document.addEventListener('keydown', event => {
    if (panel.hidden) return;
    const focus = document.activeElement;
    const inPanel = panel.contains(focus);
    const isOpener = focus === mobile || focus === desktop;
    if (!inPanel && !isOpener) return;
    const origin = isOpener ? focus : (opener || (desktop.getClientRects().length ? desktop : mobile));
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
      origin.focus();
      return;
    }
    if (event.key !== 'Tab') return;
    const links = stops(panel);
    if (!links.length) return;
    if (isOpener && !event.shiftKey) {
      event.preventDefault();
      links[0].focus();
    } else if (inPanel && focus === links[0] && event.shiftKey) {
      event.preventDefault();
      close();
      origin.focus();
    } else if (inPanel && focus === links.at(-1) && !event.shiftKey) {
      const page = stops(document).filter(el => !panel.contains(el) && el.id !== 'menu-scrim');
      const next = page[page.indexOf(origin) + 1];
      if (next) {
        event.preventDefault();
        close();
        next.focus();
      }
    }
  }, true);
})();
