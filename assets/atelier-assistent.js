(() => {
  const panel = document.getElementById('chat-panel');
  if (!panel || !panel.hasAttribute('data-shared-assistant')) return;
  const widget = panel.closest('aside');
  const $ = selector => widget.querySelector(selector);
  const $$ = selector => [...widget.querySelectorAll(selector)];
  const local = (nl,en) => document.documentElement.lang.startsWith('en') ? en : nl;
  const services = {
  agent: ["AI-agents", "AI agents", "Kies één bestaande agent vanaf € 250 of het Commerce 360-team van 14 agents vanaf € 1.499. Maatwerk, implementatie en training begroten we apart. Bedragen zijn exclusief btw.", "Choose one existing agent from €250 or the 14-agent Commerce 360 team from €1,499. Custom work, implementation and training are quoted separately. Prices exclude VAT."],
  social: ["Socialmedia", "Social media", "We brengen contentplanning, beeld, goedkeuring en publicatie samen. Zo kun je consistent posten en kwaliteit blijven bewaken.", "We bring planning, creative, approvals and publishing together so you can post consistently and oversee quality."],
  ads: ["Social advertising", "Social advertising", "Vanaf € 399 exclusief btw richten we Meta óf TikTok in, koppelen en testen we de pixel, leggen we de strategie uit en starten we één campagne. Advertentiebudget en extra creatives komen daar apart bij.", "From €399 excluding VAT, we set up Meta or TikTok, connect and test the pixel, explain the strategy and launch one campaign. Ad spend and additional creative cost extra."],

  website: ['Website','Website','Een website begint bij de klantvraag. We maken eerst een ontwerp met een duidelijke route naar contact of een aanvraag. Daarna bouwen en testen we de site op mobiel en desktop.','A website starts with the customer’s question. We design a clear path to an enquiry, then build and test it on mobile and desktop.'],
  webshop: ['Webshop','Online store','Van navigatie en productpagina’s tot betalen en bevestigen. De eerste versie richt zich op wat klanten nodig hebben om met vertrouwen te bestellen.','From navigation and product pages to payment and confirmation. The first version focuses on what customers need to order with confidence.'],
  vindbaar: ['Vindbaarheid','Visibility', "Vanaf € 1.250 exclusief btw verzorgen we een nulmeting, Search Console, een indexerings- en sitemapcheck en verbeteringen aan vijf pagina’s. Na 30 dagen bespreken we de cijfers.", "From €1,250 excluding VAT, we cover a baseline, Search Console, indexing and sitemap checks and improvements to five pages. We review the figures after 30 days."],
  };
const chatVraag = $('#chat-vraag');
const chatSturen = $('#chat-sturen');
function chatReply(key) {
  const item = services[key];
  return key === 'website' ? local('Een website bij WebshopAtelier begint bij € 999 eenmalig. Het aantal pagina’s en de gewenste functies bepalen je offerte.', 'A website from WebshopAtelier starts at a one-off €999. Your quote depends on the pages and features you need.') : item ? local(item[2],item[3]) : local('Stel je vraag in een korte call. Dan denken we gericht mee.', 'Bring your question to a short call and we’ll think it through together.');
}
function vertaalChat() {
  for (const answer of $('#chat-copy').querySelectorAll('[data-reply]')) {
    answer.textContent = chatReply(answer.dataset.reply);
  }
  for (const question of $('#chat-copy').querySelectorAll('[data-preset]')) {
    question.textContent = $('[data-question="' + question.dataset.preset + '"]').textContent;
  }
  chatVraag.placeholder = local('Stel je vraag…', 'Type your question…');
  $('#chat-launch').setAttribute('aria-label', local('Open Atelier-assistent', 'Open Atelier assistant'));
  $('#chat-close').setAttribute('aria-label', local('Chat sluiten', 'Close chat'));
  $('#chat-sturen').setAttribute('aria-label', local('Vraag versturen', 'Send question'));
  chatVraag.setAttribute('aria-label', local('Je vraag', 'Your question'));
  $('#chat-panel').closest('aside').setAttribute('aria-label', local('Atelier-assistent', 'Atelier assistant'));
}
const chatTopicsToggle = $('#chat-topics-toggle');
chatTopicsToggle?.addEventListener('click', () => {
  const open = $('#chat-panel').classList.toggle('show-chat-topics');
  chatTopicsToggle.setAttribute('aria-expanded', String(open));
  if (open) $('#chat-panel [data-question]').focus({preventScroll:true});
  const scroll = $('#chat-scroll');
  scroll.scrollTop = scroll.scrollHeight;
});
function chatAnswer(key, vraag, preset = false) {
  $('#chat-panel').classList.remove('show-chat-topics');
  chatTopicsToggle?.setAttribute('aria-expanded', 'false');
  const gesteld = document.createElement('p');
  gesteld.className = 'chat-bericht-vraag';
  gesteld.textContent = vraag;
  if (preset) gesteld.dataset.preset = key;
  const antwoord = document.createElement('p');
  antwoord.className = 'chat-bericht-antwoord';
  antwoord.dataset.reply = key || '';
  antwoord.textContent = chatReply(key);
  $('#chat-copy').append(gesteld, antwoord);
  const gesprekken = $('#chat-scroll');
  gesprekken.scrollTop = gesprekken.scrollHeight;
}
$$('[data-question]').forEach(knop => knop.addEventListener('click', () => chatAnswer(knop.dataset.question, knop.textContent, true)));
chatVraag.addEventListener('input', () => { chatSturen.disabled = !chatVraag.value.trim(); });
$('#chat-form').addEventListener('submit', gebeurtenis => {
  gebeurtenis.preventDefault();
  const vraag = chatVraag.value.trim();
  if (!vraag) return;
  const woorden = vraag.toLowerCase();
  const onderwerpen = [[/seo|geo|google|vindbaar|search/,'vindbaar'],[/agent|automati|chatbot/,'agent'],[/adverten|ads|campagn|campaign|pixel/,'ads'],[/social|instagram|tiktok/,'social'],[/webshop|store|shopify/,'webshop'],[/site|website/,'website']];
  chatAnswer(onderwerpen.find(([patroon]) => patroon.test(woorden))?.[1], vraag);
  chatVraag.value = '';
  chatSturen.disabled = true;
  chatVraag.focus();
});
function setChat(open) {
  $('#chat-launch').setAttribute('aria-expanded',open);
  $('#chat-panel').hidden = !open;
  if (open) {
    $('#chat-launch i').hidden = true;
    $('#chat-close').focus({preventScroll:true});
  }
}
$('#chat-launch').addEventListener('click', () => setChat($('#chat-panel').hidden));
$('#chat-close').addEventListener('click', () => { setChat(false); $('#chat-launch').focus(); });
$('#chat-book').addEventListener('click', () => setChat(false));
$('.chat-pakket-link').addEventListener('click', () => setChat(false));
$('#chat-panel').addEventListener('keydown', e => {
  if (e.key === 'Escape') { setChat(false); $('#chat-launch').focus(); }
});

  const translations = [...widget.querySelectorAll('[data-en]')].map(el => [el, el.textContent]);
  const sync = () => {
    translations.forEach(([el,nl]) => { el.textContent = local(nl,el.dataset.en); });
    vertaalChat();
  };
  sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
