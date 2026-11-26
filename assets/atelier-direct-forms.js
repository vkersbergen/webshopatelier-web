(() => {
  const links = [...document.querySelectorAll('[data-tally-nl]')];
  const english = () => document.documentElement.lang.startsWith('en');
  const formId = link => english() ? (link.dataset.tallyEn || link.dataset.contactEn) : (link.dataset.tallyNl || link.dataset.contactNl);
  const knownPaths = new Set(["/", "/ai-team/", "/bedrijfsgegevens/", "/contact/", "/cookies/", "/inzichten/", "/inzichten/ai-agent/", "/inzichten/ai-agent/en/", "/inzichten/ai/", "/inzichten/ai/en/", "/inzichten/chatbot-kosten/", "/inzichten/chatbot-kosten/en/", "/inzichten/checkout/", "/inzichten/checkout/en/", "/inzichten/meta-budget/", "/inzichten/meta-budget/en/", "/inzichten/nieuwe-markt/", "/inzichten/nieuwe-markt/en/", "/inzichten/seo-geo/", "/inzichten/seo-geo/en/", "/inzichten/social-kosten/", "/inzichten/social-kosten/en/", "/inzichten/webshop-conversie/", "/inzichten/webshop-conversie/en/", "/inzichten/webshop/", "/inzichten/webshop/en/", "/inzichten/website-onderhoud/", "/inzichten/website-onderhoud/en/", "/inzichten/website/", "/inzichten/website/en/", "/klachten/", "/over-ons/", "/pakketten/", "/pakketten/ai-agents/", "/pakketten/conversie-optimalisatie/", "/pakketten/onderhoud-uitbreiding/", "/pakketten/social-advertising/", "/pakketten/socialmedia/", "/pakketten/vindbaarheid/", "/pakketten/webshop/", "/pakketten/website/", "/privacy/", "/voorwaarden/", "/werk/"]);
  function referralChannel() {
    if (!document.referrer) return 'direct/onbekend';
    try {
      const host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
      if (host === location.hostname.replace(/^www\./, '')) return 'intern';
      if (['google.nl','google.be','google.com','google.co.uk','google.de','google.fr'].includes(host)) return 'Google';
      if (host === 'bing.com') return 'Bing';
      return 'verwijzing';
    } catch { return 'direct/onbekend'; }
  }
  function publicUrl(link) {
    const url = new URL('https://tally.so/r/' + formId(link));
    if (link.dataset.formKind === 'contact') {
      const path = location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
      url.searchParams.set('entry_page', knownPaths.has(path) ? path : '/');
      url.searchParams.set('source_channel', referralChannel());
      url.searchParams.set('site_language', english() ? 'en' : 'nl');
    }
    return url;
  }
  const inlineForms = [...document.querySelectorAll('[data-contact-nl]')];
  const visibleForms = new Set();
  function syncInline(container) {
    const frame = container.querySelector('iframe');
    const url = publicUrl(container);
    url.pathname = '/embed/' + formId(container);
    url.searchParams.set('hideTitle','1');
    url.searchParams.set('alignLeft','1');
    frame.title = english() ? 'Send WebshopAtelier a message' : 'Stuur WebshopAtelier een bericht';
    if (frame.getAttribute('src') !== url.href) frame.src = url.href;
  }
  function sync() {
    visibleForms.forEach(syncInline);
    for (const link of links) link.href = publicUrl(link).href;
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        visibleForms.add(entry.target);
        syncInline(entry.target);
        observer.unobserve(entry.target);
      }
    }, {rootMargin:'200px'});
    inlineForms.forEach(container => observer.observe(container));
  } else inlineForms.forEach(container => visibleForms.add(container));
  sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  for (const link of links) link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || typeof HTMLDialogElement==='undefined') return;
    event.preventDefault();
    const dialog = document.createElement('dialog');
    dialog.className = 'atelier-form-dialog';
    dialog.setAttribute('aria-label', link.textContent.trim());
    const close = document.createElement('button');
    close.type='button';
    close.setAttribute('aria-label',english() ? 'Close' : 'Sluiten');
    close.textContent='×';
    const frame = document.createElement('iframe');
    frame.title=link.textContent.trim();
    const embedded = publicUrl(link);
    embedded.pathname = '/embed/' + formId(link);
    embedded.searchParams.set('alignLeft','1');
    embedded.searchParams.set('hideTitle','1');
    embedded.searchParams.set('dynamicHeight','0');
    frame.src=embedded.href;
    const toolbar=document.createElement('div');
    const title=document.createElement('h2');
    title.textContent=english() ? 'Atelier Newsletter' : 'Atelier-Nieuwsbrief';
    toolbar.append(title,close);
    dialog.append(toolbar, frame);
    document.body.append(dialog);
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{dialog.remove();link.focus();},{once:true});
    dialog.showModal();
    close.focus();
  });
})();
