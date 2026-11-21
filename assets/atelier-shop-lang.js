(() => {
 const main=document.querySelector('main.pakket-detail');
 if (!main)return;
 const labels=[...main.querySelectorAll('[data-en]')].map(e=>[e,e.textContent,e.dataset.en]);
 function render(){const en=document.documentElement.lang.startsWith('en');main.lang=en?'en':'nl';for (const [el,nl,eng] of labels)el.textContent=en?eng:nl;const photo=main.querySelector('.wa-case-image img');if(photo)photo.alt=en?'Homepage of the ElleCera store':'De homepage van de ElleCera-webshop'}
 new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});render();
})();
