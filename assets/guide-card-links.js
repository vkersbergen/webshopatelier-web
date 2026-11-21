(() => {
  function updateLinks() {
    const english = document.documentElement.lang.startsWith('en');
    for (const link of document.querySelectorAll('a[href*="/inzichten/"]')) {
      const url = new URL(link.href);
      if (!/^\/inzichten\/[^/]+\/(?:en\/)?$/.test(url.pathname)) continue;
      url.pathname = url.pathname.replace(/\/en\/$/, '/') + (english ? 'en/' : '');
      if (url.href !== link.href) link.href = url.href;
    }
  }
  new MutationObserver(updateLinks).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.addEventListener('pageshow', updateLinks);
  updateLinks();
})();
