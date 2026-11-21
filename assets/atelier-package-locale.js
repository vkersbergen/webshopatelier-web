(() => {
  const main = document.querySelector('main.pakket-detail');
  if (!main) return;
  const labels = [...main.querySelectorAll('[data-en]')].map(node => [node, node.textContent]);
  function translate() {
    const en = document.documentElement.lang.startsWith('en');
    main.lang = en ? 'en' : 'nl';
    for (const [node, dutch] of labels) node.textContent = en ? node.dataset.en : dutch;
    for (const image of main.querySelectorAll('[data-alt-en]')) image.alt = en ? image.dataset.altEn : image.dataset.altNl;
    document.title = main.querySelector('h1').textContent + ' | WebshopAtelier';
  }
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  translate();
})();
