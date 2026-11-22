// Give nearby controls room without moving the page or interrupting an open chat.
(() => {
  const widget = document.querySelector('.as-float');
  if (!widget) return;
  const launcher = widget.querySelector('#chat-launch');
  const selector = 'button, input, select, textarea, summary, a.btn, a[role="button"]';
  let release;

  function watchCorner() {
    release?.();
    if (!matchMedia('(max-width: 720px)').matches) return;

    const floating = getComputedStyle(widget);
    const button = getComputedStyle(launcher);
    const right = parseFloat(floating.right);
    const bottom = parseFloat(floating.bottom);
    const size = parseFloat(button.width);
    const occupied = [new Set(), new Set()];
    const positions = [0, 68];

    function align() {
      widget.dataset.corner = !occupied[0].size ? 'base' : !occupied[1].size ? 'raised' : 'busy';
    }
    const observers = positions.map((offset, i) => {
      const margin = [
        -Math.max(0, innerHeight - bottom - offset - size - 4),
        -Math.max(0, right - 4),
        -Math.max(0, bottom + offset - 4),
        -Math.max(0, innerWidth - right - size - 4)
      ];
      return new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.isConnected) occupied[i].add(entry.target);
          else occupied[i].delete(entry.target);
        }
        align();
      }, {rootMargin: margin.map(value => value + 'px').join(' ')});
    });

    function targets(root, add) {
      if (root.nodeType !== 1 || root.closest('header, dialog, .as-float')) return;
      const elements = [...root.querySelectorAll(selector)];
      if (root.matches(selector)) elements.push(root);
      for (const el of elements) {
        if (add && el.closest('header, dialog, .as-float')) continue;
        observers.forEach((observer, i) => {
          if (add) observer.observe(el);
          else {
            observer.unobserve(el);
            occupied[i].delete(el);
          }
        });
      }
    }
    targets(document.body, true);
    const changes = new MutationObserver(records => {
      for (const record of records) {
        record.removedNodes.forEach(el => targets(el, false));
        record.addedNodes.forEach(el => targets(el, true));
      }
      align();
    });
    changes.observe(document.body, {childList:true, subtree:true});
    release = () => {
      changes.disconnect();
      observers.forEach(observer => observer.disconnect());
      delete widget.dataset.corner;
    };
  }
  watchCorner();
  addEventListener('resize', watchCorner, {passive:true});
})();
