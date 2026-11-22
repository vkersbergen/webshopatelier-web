(() => {
'use strict';
const host = document.querySelector('main > #werk');
if (!host) return;
const mobile = matchMedia('(max-width:720px)');
const reduced = matchMedia('(prefers-reduced-motion:reduce)');
const english = () => document.documentElement.lang.startsWith('en');
const t = (nl, en) => english() ? en : nl;
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const team = '/assets/atelier/commerce-360-team-glas.webp';
const packages = [
 ['website','Website','Website','website','Vanaf € 999','From €999','website'],
 ['webshop','Webshop','Online store','webshop','Vanaf € 2.900','From €2,900','webshop'],
 ['ai','AI-agents op maat','Custom AI agents','ai-agents','Vanaf € 250 per agent','From €250 per agent','agent'],
 ['zoeken','Vindbaarheid','Search visibility','vindbaarheid','Vanaf € 1.250','From €1,250','vindbaar'],
 ['advertenties','Adverteren','Advertising','social-advertising','Vanaf € 399','From €399','ads'],
 ['social','Socialmediabeheer','Social media management','socialmedia','','','social'],
 ['conversie','Conversie & optimalisatie','Conversion & optimisation','conversie-optimalisatie','','','conversie'],
 ['onderhoud','Onderhoud & uitbreiding','Maintenance & extensions','onderhoud-uitbreiding','','','onderhoud']
];
const cases =
[
  {
    "slug": "ellecera",
    "brand": "ElleCera",
    "title": [
      "Skincare Brand",
      "Skincare brand"
    ],
    "intro": [
      "Een meertalige Shopify-winkel met een eigen dashboard en AI-team voor het dagelijkse werk.",
      "A multilingual Shopify store with a dedicated dashboard and AI team for everyday operations."
    ],
    "desk": "ellecera-desk-poster.webp",
    "tel": "ellecera-tel.webp",
    "video": "ellecera-desk.mp4",
    "groups": [
      [
        "Domein & mail",
        "Domain & email",
        "Het domein geregistreerd.",
        "Registered the domain.",
        "Zakelijke e-mail ingericht voor het contact met klanten.",
        "Set up business email for customer enquiries."
      ],
      [
        "Shopify & talen",
        "Shopify & languages",
        "De winkel en productpagina’s per taal ingericht.",
        "Set up the storefront and product pages for each language.",
        "Eigen thema-onderdelen gebouwd voor de homepage en videobanner.",
        "Built custom homepage components and a video hero."
      ],
      [
        "Producten & acties",
        "Products & offers",
        "Foto’s, video en bundelkeuzes samengebracht op de productpagina’s.",
        "Combined photography, video and bundle options on product pages.",
        "Voor acties eigen landingspagina’s gemaakt.",
        "Built dedicated landing pages for promotions."
      ],
      [
        "Campagnes & e-mail",
        "Campaigns & email",
        "Campagnes ingericht voor Meta en TikTok.",
        "Set up Meta and TikTok campaigns.",
        "E-mailreeksen voor klanten geautomatiseerd.",
        "Automated customer email sequences."
      ],
      [
        "Dashboard",
        "Dashboard",
        "Winkelomzet en advertentie-uitgaven in één dashboard bijeengebracht.",
        "Combined store revenue and advertising spend in one dashboard.",
        "De ontwikkeling van de dagwinst inzichtelijk gemaakt.",
        "Made changes in daily profit visible."
      ],
      [
        "AI-team & processen",
        "AI team & operations",
        "Een eigen team van AI-agents ingericht.",
        "Set up a dedicated team of AI agents.",
        "Terugkerende werkprocessen geautomatiseerd.",
        "Automated recurring operational tasks."
      ]
    ]
  },
  {
    "slug": "scillasdotter",
    "brand": "Scillasdotter",
    "title": [
      "Coutureatelier",
      "Couture atelier"
    ],
    "intro": [
      "Een meertalig portfolio brengt de ontwerpen en een afspraak in het atelier bij elkaar.",
      "A multilingual portfolio connects the collection with appointment enquiries."
    ],
    "desk": "scillas-desk-poster.webp",
    "tel": "scillas-tel.webp",
    "video": "scillas-desk.mp4",
    "groups": [
      [
        "Portfolio & collectie",
        "Portfolio & collection",
        "Een digitaal portfolio gebouwd rond de ontwerpen van het atelier.",
        "Built an online portfolio around the atelier’s designs.",
        "De fotografie een centrale plek gegeven in de collectiepresentatie.",
        "Made photography central to the collection presentation."
      ],
      [
        "Meertaligheid",
        "Languages",
        "De collectie in meerdere talen toegankelijk gemaakt.",
        "Made the collection available in multiple languages.",
        "De aanvraagroute in diezelfde talen ingericht.",
        "Localised the enquiry journey into those languages."
      ],
      [
        "Afspraak & contact",
        "Appointments & contact",
        "Een eigen pagina voor afspraakaanvragen gemaakt.",
        "Created a dedicated appointment enquiry page.",
        "Een persoonlijk e-mailadres ingericht voor direct contact met het atelier.",
        "Set up a personal business email for direct contact with the atelier."
      ],
      [
        "Vindbaarheid",
        "Search visibility",
        "De technische SEO voor de site ingericht.",
        "Set up technical SEO for the site.",
        "Gestructureerde gegevens toegevoegd.",
        "Added structured data."
      ]
    ]
  },
  {
    "slug": "doggy-en-cats",
    "brand": "Doggy & Cats",
    "title": [
      "Dierenwebshop",
      "Pet store"
    ],
    "intro": [
      "Een AI-team bereidt klantvragen en productcontent voor. Het dashboard bundelt de dagelijkse winkelcijfers.",
      "An AI team prepares customer replies and product content. A dashboard brings the daily figures together."
    ],
    "desk": "doggy-desk5.webp",
    "tel": "doggy-tel5.webp",
    "video": "",
    "groups": [
      [
        "AI-team & goedkeuring",
        "AI team & approval",
        "Het team getraind in het werken met AI.",
        "Trained the team to work with AI.",
        "Vastgelegd welke taken mensen controleren voordat ze doorgaan.",
        "Defined which tasks need a person’s approval."
      ],
      [
        "Klantenservice",
        "Customer service",
        "Een klantenservice-agent ingericht voor binnenkomende vragen.",
        "Set up a customer service agent for incoming enquiries.",
        "Conceptantwoorden klaargezet voor controle door het team.",
        "Prepared draft replies for team review."
      ],
      [
        "Productcontent & advertenties",
        "Product content & advertising",
        "AI-agents ingericht om productpagina’s voor te bereiden.",
        "Set up AI agents to help prepare product pages.",
        "Advertentie-ideeën via het team laten voorbereiden.",
        "Used the team to develop initial advertising concepts."
      ],
      [
        "Rapportage",
        "Reporting",
        "Dagelijkse winkelcijfers samengebracht in één dashboard.",
        "Brought daily store figures together in one dashboard."
      ]
    ]
  },
  {
    "slug": "the-focus-club",
    "brand": "The Focus Club",
    "title": [
      "Focus & welzijn",
      "Focus & wellbeing"
    ],
    "intro": [
      "Van concurrentieonderzoek naar advertentiebeelden en video’s over focus en welzijn.",
      "From competitor research to campaign photography and video for a wellbeing brand."
    ],
    "desk": "focusclub-desk5.webp",
    "tel": "focusclub-tel5.webp",
    "video": "",
    "groups": [
      [
        "Concurrentieonderzoek",
        "Competitor research",
        "Onderzocht hoe andere merken producten voor focus en rust presenteren.",
        "Studied how competing brands present products for focus and calm.",
        "Die bevindingen gebruikt om advertentie-invalshoeken te kiezen.",
        "Used the findings to choose advertising angles."
      ],
      [
        "Concept & productie",
        "Concept & production",
        "De ideeën uitgewerkt tot statische advertenties.",
        "Developed the concepts into static adverts.",
        "Video’s gemaakt om ook bewegend beeld te kunnen testen.",
        "Produced videos to test moving-image formats."
      ],
      [
        "Campagnes & testen",
        "Campaigns & testing",
        "Campagnes ingericht voor de verschillende varianten.",
        "Set up campaigns for the different variants.",
        "De prestaties van advertenties met elkaar vergeleken.",
        "Compared the performance of the adverts."
      ],
      [
        "Opschalen",
        "Scaling",
        "De best presterende advertenties geselecteerd en opgeschaald.",
        "Selected and scaled the best-performing ads."
      ]
    ]
  }
];
const devices = c => {
 const desktop=c.video ? `<video muted playsinline loop preload="none" poster="/assets/${c.desk}" data-src="/assets/${c.video}" aria-label="${esc(c.brand)} desktop"></video>` : `<img loading="lazy" src="/assets/${c.desk}" alt="${esc(c.brand)} desktop">`;
 return `<div class="devices"><div class="desktop-device">${desktop}</div><div class="phone-device"><img loading="lazy" src="/assets/${c.tel}" alt="${esc(c.brand)} ${t('mobiel','mobile')}"></div></div>`;
};
function action(url, label) {return `<a class="action" href="${esc(url)}">${esc(label)}</a>`;}
function rail(label, slides) {return `<div class="rail" aria-label="${esc(label)}">${slides.map(s=>`<div class="slide">${s}</div>`).join('')}</div>`;}
function caseGroups(c) {
 const l=Number(english());
 return c.groups.map(g=>`<h4>${esc(g[l])}</h4><ul>${g.slice(2).filter((_,i)=>i%2===l).map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`).join('');
}
function caseMarkup(c) {
 const l=Number(english());
 const groups=caseGroups(c);
 return `<article class="werk-panel">${devices(c)}<div class="werk-copy"><p class="atelier-label">${esc(c.brand)}</p><h3>${esc(c.title[l])}</h3><p>${esc(c.intro[l])}</p><details><summary>${t('Wat we deden','What we did')}</summary>${groups}</details>${action('/werk/'+c.slug+'/'+t('','en/'),t('Lees de case','Read the case'))}</div></article>`;
}
function packageMarkup() {
 const cards=packages.map(([img,nl,en,slug,price,priceEn,id])=>`<article class="pakket-card" data-anchor="pakket-${id}"><img width="512" height="384" loading="lazy" src="/assets/atelier-agents/${img}.webp" alt=""><div><h3>${esc(t(nl,en))}</h3>${img==='website' || img==='webshop' ? '<small class="offer-sub">'+(img==='website'?t('Webdesign op maat','Custom web design'):t('Shopify op maat','Custom Shopify store'))+'</small>' : ''}<p>${esc(t(price,priceEn)||t('Prijs op maat','Custom quote'))}</p>${action('/pakketten/'+slug+'/',t('Lees meer','Read more'))}</div></article>`);
 const slides=cards.flatMap((card,i)=>i%2 ? [] : [`<div class="pakket-paar">${card}${cards[i+1]}</div>`]);
 return `<h2>${t('Onze <em>pakketten.</em>','Our <em>packages.</em>')}</h2><article class="pakket-commerce"><img width="1440" height="480" loading="${location.pathname.replace(/\/$/,'')==='/pakketten'?'eager':'lazy'}" src="${team}" alt="${t('Het AI-team','The AI team')}"><div><h3>Atelier Commerce 360</h3><p>${t('Ontvang 14 AI-agents voor je webshop.','Get 14 AI agents for your store.')}</p><strong>${t('Vanaf € 1.499','From €1,499')}</strong>${action('/ai-team/',t('Ontdek Commerce 360','Discover Commerce 360'))}</div></article>${rail(t('Pakketten','Packages'),slides)}`;
}
function articles(section) {
 const cards=[...section.querySelectorAll('#blograster [data-blogkaart]')].map(card=>{
  const i=card.querySelector('img'), a=card.querySelector('a'), h=card.querySelector('h3'), label=card.querySelector('.eyebrow');
  const path=new URL(a.href).pathname.replace(/\/en\/$/,'/')+t('','en/');
  return `<article class="article-card"><img loading="lazy" src="${esc(i.getAttribute('src'))}" srcset="${esc(i.srcset)}" sizes="82vw" width="${i.getAttribute('width')}" height="${i.getAttribute('height')}" alt="${esc(t(i.dataset.altNl,i.dataset.altEn)||'')}"><div><p class="atelier-label">${esc(t(label.textContent,label.dataset.en))}</p><h3>${esc(t(h.textContent,h.dataset.en))}</h3>${action(path,t('Lees artikel','Read article'))}</div></article>`;
 });
 return `<h2>${t('Tips en <em>inzichten.</em>','Tips and <em>insights.</em>')}</h2>${rail(t('Artikelen','Articles'),cards)}`;
}
function tools(section) {
 const priority=['Shopify','Meta','Google Ads','ChatGPT','Klaviyo','Canva','TikTok','Stripe','Mollie','PayPal','Pinterest Business','YouTube Ads'];
 const tiles=new Map();
 for (const node of section.querySelectorAll('.platform-groepen .brandchip')) {
  const name=node.querySelector('.platform-naam')?.textContent.trim();
  if (!name || tiles.has(name)) continue;
  const image=node.querySelector('svg,img')?.cloneNode(true);
  if (image?.tagName==='IMG') image.loading='lazy';
  tiles.set(name,`<div class="tool-tile" data-tool="${esc(name)}" style="--brand:${esc(node.style.getPropertyValue('--brand')||'currentColor')}">${image?.outerHTML||''}<span>${esc(name)}</span></div>`);
 }
 const first=priority.filter(key=>tiles.has(key));
 return `<h2>${t('Tools waarmee <em>we werken.</em>','Tools we <em>work with.</em>')}</h2><div class="tool-tiles">${first.map(k=>tiles.get(k)).join('')}</div><details><summary>${t('Alle tools bekijken','View all tools')}</summary><div class="tool-tiles">${[...tiles].filter(([key])=>!first.includes(key)).map(([,tile])=>tile).join('')}</div></details>`;
}
const sections={
 commerce:()=>`<article class="commerce-panel"><img class="commerce-team" src="${team}" width="1440" height="480" loading="lazy" alt="${t('Glazen AI-agents rond hun werktafel','Glass AI agents around their worktable')}"><div class="commerce-text"><p class="atelier-label">Atelier Commerce 360</p><h2>${t('Jouw eigen <em>AI-team.</em>','Your own <em>AI team.</em>')}</h2><p>${t('Ontvang 14 getrainde AI-agents voor je webshop, campagnes en klantenservice. Jij bepaalt wat live gaat.','Get 14 trained AI agents for your store, campaigns and customer service. You decide what goes live.')}</p>${action('/ai-team/',t('Ontdek Commerce 360','Discover Commerce 360'))}</div></article>`,
 werk:()=>`<h2>${t('Ons <em>werk.</em>','Our <em>work.</em>')}</h2>${rail(t('Projecten','Projects'),cases.map(caseMarkup))}`,
 pakketten:packageMarkup, tools, veldgids:articles,
 atelier:section=>`<div class="oprichter-lead"><img loading="lazy" src="/assets/atelier/founder-240.webp" alt="${t('Oprichter van WebshopAtelier','Founder of WebshopAtelier')}"><div><p class="atelier-label">${t('Even voorstellen','Meet the founder')}</p><h2>${t('Webshopnerds <em>in hart en nieren.</em>','Shop nerds <em>at heart.</em>')}</h2></div></div><p>${location.pathname==='/over-ons/' ? esc(section.querySelector('.founder-message')?.textContent||'') : t('We runnen zelf webshops. Daardoor kennen we de vragen die pas opduiken als de winkel open is.','We run stores ourselves. We know the questions that only surface once your store is open.')}</p>${location.pathname==='/over-ons/' ? '' : action('/over-ons/',t('Over het atelier','About the atelier'))}`,
 ontzorg:()=>`<h2>${t('Wat je kunt <em>uitbesteden.</em>','What you can <em>hand over.</em>')}</h2><ul class="taken"><li>${t('Je productpagina’s bouwen en bijwerken.','Build and update your product pages.')}</li><li>${t('Je campagnes maken, testen en bijsturen.','Create, test and refine your campaigns.')}</li></ul><details><summary>${t('Lees meer','Read more')}</summary><ul class="taken"><li>${t('Klantmails voorbereiden.','Prepare customer emails.')}</li><li>${t('Domein en zakelijke mail inrichten.','Set up your domain and business email.')}</li><li>${t('Je winkelcijfers in één dashboard verzamelen.','Bring your store figures together in one dashboard.')}</li></ul></details>`
};
function controls(row) {
 const slides=[...row.children];
 const ui=document.createElement('div');
 ui.className='slider-ui ec-line';
 ui.setAttribute('role','group'); ui.setAttribute('aria-label',row.getAttribute('aria-label'));
 row.after(ui);
 const titles=slides.map(s=>s.querySelector('.werk-copy .atelier-label')?.textContent||[...s.querySelectorAll('h3')].map(h=>h.textContent).join(' · '));
 let selected=0, destination=null;
 function select(index, instant=false) {
  destination=Math.max(0,Math.min(slides.length-1,index));
  row.scrollBy({left:slides[destination].getBoundingClientRect().left-row.getBoundingClientRect().left,behavior: instant || reduced.matches?'instant':'smooth'});
 }
 function button(cls,label,cb) {
  const b=document.createElement('button'); b.type='button';b.className=cls;b.setAttribute('aria-label',label);b.addEventListener('click',()=>{if(b.getAttribute('aria-disabled')!=='true')cb();});return b;
 }
 const prev=button('step step--prev',t('Vorige','Previous'),()=>select((destination??selected)-1));
 const next=button('step step--next',t('Volgende','Next'),()=>select((destination??selected)+1));
 const track=document.createElement('div');
 track.className='ec-position';
 const thumb=document.createElement('i');
 thumb.style.width=(100/slides.length)+'%';
 track.append(thumb);
 track.setAttribute('aria-hidden','true');
 ui.append(track,prev,next);
 const status=document.createElement('span');
 status.className='ec-position-label';status.setAttribute('role','status');ui.append(status);
 function update() {
  const x=row.getBoundingClientRect().left;
  let near=0;
  slides.forEach((s,i)=>{if(Math.abs(s.getBoundingClientRect().left-x)<Math.abs(slides[near].getBoundingClientRect().left-x))near=i;});
  selected=near;if(selected===destination)destination=null;
  prev.setAttribute('aria-disabled',String(near===0));
  next.setAttribute('aria-disabled',String(near===slides.length-1));
  thumb.style.transform='translateX('+near*100+'%)';
  const label=(near+1)+' / '+slides.length+' · '+titles[near];
  if(status.textContent!==label)status.textContent=label;
  // The controls follow the visible case directly, including when a single disclosure opens.
  if(row.closest('.wa-werk'))row.style.height=slides[near].offsetHeight+'px';
 }
 let raf=0;
 const tick=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(update);};
 row.addEventListener('scroll',tick,{passive:true});
 let gesture=null;
 row.addEventListener('pointerdown',event=>{
  destination=null;
  if(!event.isPrimary || event.pointerType!=='touch')return;
  gesture={x:event.clientX,y:event.clientY,start:row.scrollLeft,index:selected,direction:null,pointer:event.pointerId};
 });
 row.addEventListener('pointermove',event=>{
  if(!gesture || gesture.pointer!==event.pointerId)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(!gesture.direction){
   if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
   if(Math.abs(dy)>=Math.abs(dx)){gesture=null;return;}
   gesture.direction='horizontal';row.setPointerCapture(event.pointerId);row.classList.add('is-dragging');
  }
  row.scrollLeft=gesture.start-dx;
 });
 function endGesture(event){
  if(!gesture || gesture.pointer!==event.pointerId)return;
  const drag=gesture;gesture=null;row.classList.remove('is-dragging');
  if(!drag.direction)return;
  const dx=event.clientX-drag.x;
  select(event.type==='pointercancel' || Math.abs(dx)<32 ? drag.index : drag.index+(dx<0?1:-1));
 }
 row.addEventListener('pointerup',endGesture);
 row.addEventListener('pointercancel',endGesture);

 row.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();select((destination??selected)+(e.key==='ArrowLeft'?-1:1));
 });
 const size=new ResizeObserver(tick);slides.forEach(s=>size.observe(s));
 update();return ()=>{size.disconnect();cancelAnimationFrame(raf);};
}

const mounted=new Map();
const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{
 if(e.isIntersecting){e.target.classList.add('wa-revealed');reveal.unobserve(e.target);}
}));
const videos=new IntersectionObserver(entries=>entries.forEach(e=>{
 const v=e.target;
 if(e.intersectionRatio>.35 && !reduced.matches && !navigator.connection?.saveData && !document.hidden){
  if(!v.hasAttribute('src'))v.src=v.dataset.src;
  v.play().catch(()=>{});
 } else v.pause();
}),{threshold:[0,.35,.5,1]});
const classFor={atelier:'oprichter',veldgids:'artikelen'};
function render(section, id) {
 const block=document.createElement('div');block.className='wa-mobile';
 const contents=document.createElement('div');contents.className='atelier-s wa-'+(classFor[id]||id);contents.innerHTML=sections[id](section);block.append(contents);
 const oldHeading=section.querySelector('h1'),newHeading=contents.querySelector('h2');
 if(oldHeading && newHeading) {const h=document.createElement('h1');h.className='wa-title';h.innerHTML=newHeading.innerHTML;newHeading.replaceWith(h);}
 section.append(block);section.classList.add('wa-enhanced');
 const cleanups=[...block.querySelectorAll('.rail')].map(row=>controls(row));
 block.querySelectorAll('video').forEach(v=>videos.observe(v));reveal.observe(block);
 return ()=>{cleanups.forEach(clean=>clean());block.querySelectorAll('video').forEach(v=>{videos.unobserve(v);v.pause();});reveal.unobserve(block);block.remove();section.classList.remove('wa-enhanced');};
}
const founder=document.querySelector('main > #atelier'), process=document.querySelector('main > #keuze');
const originalSpot=document.createComment('Founder section');if(founder)founder.before(originalSpot);
let language;
function updateLayout(){
 const isMobile=mobile.matches, lang=english();
 const home=location.pathname==='/' && !location.hash.startsWith('#/');
 document.body.classList.toggle('wa-home',home);
 if(founder && process) {
  if(isMobile && home && founder.nextElementSibling!==process) process.before(founder);
  if((!isMobile || !home) && originalSpot.nextElementSibling!==founder) originalSpot.after(founder);
 }
 for(const [id] of Object.entries(sections)){
  const section=document.querySelector('main > #'+id);if(!section)continue;
  const show=isMobile && !section.hidden;
  if(mounted.has(id) && (!show || lang!==language)){mounted.get(id)();mounted.delete(id);}
  if(show && !mounted.has(id)) mounted.set(id,render(section,id));
 }
 language=lang;
 const short=[
  ['We spreken resultaat en budget af.','We agree on the outcome and budget.'],
  ['Je ziet eerst hoe het op mobiel werkt.','You see how it works on mobile first.'],
  ['Samen bekijken we de eerste resultaten.','We review the first results together.']
 ];
 process?.querySelectorAll('.aanpak-stappen li').forEach((li,i)=>{
  const full=li.querySelector('p');if(!full || !short[i])return;full.classList.add('wa-step-full');
  let shortP=li.querySelector('.wa-step-short');
  if(!shortP){shortP=document.createElement('p');shortP.className='wa-step-short';full.after(shortP);}shortP.textContent=t(...short[i]);
 });
}
function alignPackage(){
 if(!mobile.matches || !location.hash.includes('pakket-'))return;
 const key=location.hash.split(/[#/]/).pop();const card=[...document.querySelectorAll('.wa-mobile [data-anchor]')].find(e=>e.dataset.anchor===key);
 if(!card)return;
 const row=card.closest('.rail'),slide=card.closest('.slide');
 row.scrollBy({left:slide.getBoundingClientRect().left-row.getBoundingClientRect().left,behavior:'instant'});
 row.scrollIntoView({block:'center',behavior:'instant'});
}
let pending=0;
const schedule=()=>{cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{updateLayout();alignPackage();});};
const visible=new MutationObserver(schedule);
document.querySelectorAll('main > section').forEach(s=>visible.observe(s,{attributes:true,attributeFilter:['hidden']}));
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
mobile.addEventListener('change',schedule);window.addEventListener('hashchange',schedule);
document.addEventListener('visibilitychange',()=>{document.querySelectorAll('.wa-mobile video').forEach(v=>{videos.unobserve(v);videos.observe(v);});});
// Keep the original desktop device animation and tabs; let the case button open its own dossier.
const desktopCopy=host.querySelector('.case-copy');
const desktopLink=host.querySelector('#case-link');
const originalTasks=host.querySelector('#case-bijdrage');
if(desktopCopy && desktopLink && originalTasks) {
 const excerpt=document.createElement('p');excerpt.className='wa-case-excerpt';
 const disclosure=document.createElement('details');disclosure.className='wa-case-tasks';
 originalTasks.after(excerpt,disclosure);desktopCopy.classList.add('wa-case-finished');
 let displayed='';
 function updateDesktopCase() {
  const selected=Number(host.querySelector('[data-case][aria-pressed="true"]')?.dataset.case||0);
  const c=cases[selected];if(!c)return;
  const l=Number(english()),key=selected+'-'+l;
  if(key!==displayed) {
   excerpt.textContent=c.intro[l];disclosure.open=false;
   disclosure.innerHTML='<summary>'+t('Wat we deden','What we did')+'</summary>'+caseGroups(c);
   displayed=key;
  }
  const href='/werk/'+c.slug+'/'+t('','en/');
  if(desktopLink.getAttribute('href')!==href)desktopLink.setAttribute('href',href);
  desktopLink.removeAttribute('target');desktopLink.removeAttribute('rel');
  desktopLink.dataset.en='Read the case';desktopLink.dataset.nl='Lees de case';
  desktopLink.textContent=t('Lees de case','Read the case');
  const tag=host.querySelector('#case-tag'), name=host.querySelector('#case-name');
  if(tag)tag.textContent=c.brand;if(name)name.textContent=c.title[l];
 }
 const changed=new MutationObserver(updateDesktopCase);
 changed.observe(desktopLink,{attributes:true,attributeFilter:['href']});
 changed.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 host.querySelectorAll('[data-case]').forEach(button=>changed.observe(button,{attributes:true,attributeFilter:['aria-pressed']}));
 updateDesktopCase();
}
schedule();
})();
