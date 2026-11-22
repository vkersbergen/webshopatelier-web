(() => {
  const footer = document.querySelector('#atelier-foot.r2-foot');
  if (!footer) return;
  const signup = footer.querySelector('.af-subscribe');
  const navigation = footer.querySelector('.r2-about nav');
  function sync() {
    const english = document.documentElement.lang.startsWith('en');
    for (const label of footer.querySelectorAll('[data-af-nl]')) {
      label.textContent = english ? label.dataset.afEn : label.dataset.afNl;
    }
    navigation.ariaLabel = english ? 'About the studio' : 'Over het atelier';
    signup.href = 'https://tally.so/r/' + (english ? 'bZWjVe' : '7XNLlL');
  }
  sync();
  new MutationObserver(sync).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  const query = new URLSearchParams(location.search);
  if (query.get('atelierpost') === '1' || query.get('rad') === '1') {
    footer.querySelector('#newsletter').scrollIntoView();
  }
})();
