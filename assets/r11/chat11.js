/* Webshopatelier r11b: de atelier-minion beantwoordt vragen uit de inhoud van de site zelf.
   Geen API, geen sleutels, geen externe kosten: herkenning op trefwoorden en synoniemen, per antwoord een passende knop.
   Nederlands en Engels (taal van de pagina). */
(function () {
  var c = document.querySelector('.chat9'); if (!c) return;
  var en = (document.documentElement.lang || 'nl').indexOf('en') === 0;
  var BOEK = '/contact/#boeken', EBOOK = 'https://tally.so/r/' + (en ? 'bZWjVe' : '7XNLlL');
  var T = en ? {
    titel: 'Atelier minion', sub: 'Answers from this site', hoi: 'Hi! I’m the atelier minion. Ask me about prices, the AI team, our work or a call.',
    snel: [['What does it cost?', 'prijs'], ['What is the AI team?', 'team'], ['Do you build stores?', 'webshop'], ['Book a call', 'contact']],
    plaats: 'Type your question', stuur: 'Send', boek: 'Book a call', mis: 'I don’t have a good answer to that yet. Book a call or email hello@webshopatelier.nl and we’ll help you personally.', mail: 'Email us', voet: 'Answers come from the content of this site.'
  } : {
    titel: 'Atelier-minion', sub: 'Antwoordt uit de site', hoi: 'Hoi! Ik ben de atelier-minion. Vraag me iets over prijzen, het AI-team, ons werk of een kennismaking.',
    snel: [['Wat kost het?', 'prijs'], ['Wat is het AI-team?', 'team'], ['Bouwen jullie webshops?', 'webshop'], ['Plan een call', 'contact']],
    plaats: 'Typ je vraag', stuur: 'Versturen', boek: 'Boek een call', mis: 'Daar heb ik nog geen goed antwoord op. Plan een call of mail hello@webshopatelier.nl, dan helpen we je persoonlijk.', mail: 'Mail ons', voet: 'Antwoorden komen uit de inhoud van deze site.'
  };
  // kennis uit de site: [id, trefwoorden NL, trefwoorden EN, antwoord NL, antwoord EN, knoppen [[label NL, label EN, href]]]
  var K = [
    ['prijs', ['prijs', 'kost', 'kosten', 'tarief', 'betalen', 'budget', 'duur', 'goedkoop', 'euro', 'offerte', 'investering', 'wat betaal'], ['price', 'cost', 'costs', 'pricing', 'fee', 'budget', 'expensive', 'cheap', 'quote', 'how much', 'pay'],
      'Vanafprijzen, eenmalig en exclusief btw: AI-team (Atelier Commerce 360) € 1.499, website € 999, Shopify-webshop € 2.900, online vindbaarheid € 1.250, adverteren € 399 plus advertentiebudget, één losse AI-agent € 250. Socialmediabeheer, conversie en onderhoud zijn op maat.',
      'Starting prices, one-off and excluding VAT: AI team (Atelier Commerce 360) €1,499, website €999, Shopify store €2,900, findability €1,250, advertising €399 plus ad budget, a single AI agent €250. Social media, conversion and maintenance are priced on request.',
      [['Alle pakketten', 'All packages', '/pakketten/'], ['Boek een call', 'Book a call', BOEK]]],
    ['team', ['ai-team', 'aiteam', 'team', 'agents', 'agent', 'afdeling', 'afdelingen', 'medewerkers', 'commerce 360', 'wie doet', 'rollen'], ['ai team', 'team', 'agents', 'agent', 'department', 'departments', 'roles', 'staff', 'commerce 360'],
      'Je AI-team telt 10 agents in vijf afdelingen: Directie (Chief of Staff, Operations Associate), Marketing (Head of Copy, Media Buyer), Webshop en design (Design Director, E-commerce Developer), Data en financiën (Performance Analyst, Financial Controller) en Klant en kwaliteit (Customer Service Manager, Quality Auditor). Jij geeft de opdracht, elke agent wacht op jouw akkoord voordat er iets live gaat. Vanaf € 1.499.',
      'Your AI team has 10 agents in five departments: Management (Chief of Staff, Operations Associate), Marketing (Head of Copy, Media Buyer), Store and design (Design Director, E-commerce Developer), Data and finance (Performance Analyst, Financial Controller) and Customer and quality (Customer Service Manager, Quality Auditor). You give the brief; every agent waits for your approval before anything goes live. From €1,499.',
      [['Bekijk het team', 'See the team', '/ai-team/'], ['Boek een call', 'Book a call', BOEK]]],
    ['optioneel', ['optioneel', 'optionele', 'specialist', 'specialisten', 'extra', 'uitbreiden', 'groeien', 'brand strategist', 'bookkeeper', 'boekhouding', 'compliance', 'google ads', 'creative director'], ['optional', 'specialist', 'specialists', 'extra', 'add', 'expand', 'bookkeeper', 'bookkeeping', 'compliance', 'google ads', 'creative director'],
      'Als je groeit, neem je optionele specialisten erbij: Creative Director, Brand Strategist, Google Ads Specialist, Onboarding Specialist, Market Research Analyst, Bookkeeper, Compliance Officer en Supply Chain Monitor. De prijs is op aanvraag.',
      'As you grow, you can add optional specialists: Creative Director, Brand Strategist, Google Ads Specialist, Onboarding Specialist, Market Research Analyst, Bookkeeper, Compliance Officer and Supply Chain Monitor. Pricing on request.',
      [['Vraag een specialist aan', 'Request a specialist', BOEK], ['Bekijk het team', 'See the team', '/ai-team/#optioneel']]],
    ['webshop', ['webshop', 'shopify', 'winkel', 'online shop', 'e-commerce', 'ecommerce', 'verkopen', 'store'], ['store', 'shop', 'shopify', 'e-commerce', 'ecommerce', 'online store', 'sell'],
      'We bouwen Shopify-webshops op maat, vanaf € 2.900: mobiel ontwerp, collecties, productpagina’s, betalen en verzenden, en een overdracht voor dagelijks beheer. Zo bouwden we onder meer ElleCera en Doggy & Cats.',
      'We build custom Shopify stores from €2,900: mobile design, collections, product pages, payments and shipping, and a handover for day-to-day management. ElleCera and Doggy & Cats are examples.',
      [['Pakket webshop', 'Store package', '/pakketten/webshop/'], ['Bekijk ons werk', 'See our work', '/werk/']]],
    ['website', ['website', 'site', 'webdesign', 'portfolio', 'landingspagina', 'homepage'], ['website', 'site', 'web design', 'portfolio', 'landing page', 'homepage'],
      'Een website op maat begint bij € 999: doel en route vastleggen, eerst het mobiele ontwerp, dan bouwen met formulieren, SEO-basis en livegang. Scillasdotter is een voorbeeld.',
      'A custom website starts at €999: we set the goal and visitor route, design mobile first, then build with forms, an SEO foundation and launch. Scillasdotter is an example.',
      [['Pakket website', 'Website package', '/pakketten/website/'], ['Boek een call', 'Book a call', BOEK]]],
    ['vindbaar', ['seo', 'geo', 'google', 'vindbaar', 'vindbaarheid', 'gevonden', 'zoekmachine', 'chatgpt', 'ai-zoek'], ['seo', 'geo', 'google', 'findability', 'search', 'found', 'ranking', 'chatgpt'],
      'Online vindbaarheid voor Google en AI-zoekdiensten begint bij € 1.250: nulmeting, Search Console, vijf belangrijke pagina’s verbeteren en een nabespreking na 30 dagen.',
      'Findability in Google and AI search starts at €1,250: a baseline, Search Console, improving five key pages and a review after 30 days.',
      [['Pakket vindbaarheid', 'Findability package', '/pakketten/vindbaarheid/'], ['Lees: SEO en GEO', 'Read: SEO and GEO', en ? '/inzichten/seo-geo/en/' : '/inzichten/seo-geo/']]],
    ['adverteren', ['advert', 'adverteren', 'advertenties', 'ads', 'meta', 'facebook', 'instagram', 'tiktok', 'campagne', 'roas'], ['ads', 'advertising', 'advertise', 'meta', 'facebook', 'instagram', 'tiktok', 'campaign', 'roas'],
      'Adverteren op Meta of TikTok begint bij € 399 plus advertentiebudget: account en pixel inrichten, strategie, en één campagne die pas na jouw akkoord start. Het budget betaal je rechtstreeks aan het platform.',
      'Advertising on Meta or TikTok starts at €399 plus ad budget: account and pixel setup, strategy, and one campaign that only starts after your approval. You pay the ad budget directly to the platform.',
      [['Pakket adverteren', 'Advertising package', '/pakketten/social-advertising/'], ['Boek een call', 'Book a call', BOEK]]],
    ['social', ['social', 'socialmedia', 'social media', 'content', 'posts', 'reels', 'linkedin'], ['social', 'social media', 'content', 'posts', 'reels', 'linkedin'],
      'Socialmediabeheer is op maat: contentplan, creatie, publicatie en goedkeuring per ronde, afhankelijk van kanalen en frequentie.',
      'Social media management is priced on request: content plan, creation, publishing and approval rounds, depending on channels and frequency.',
      [['Pakket social', 'Social package', '/pakketten/socialmedia/'], ['Boek een call', 'Book a call', BOEK]]],
    ['conversie', ['conversie', 'optimalisatie', 'cro', 'meer bestellingen', 'checkout', 'kassa', 'verbeteren'], ['conversion', 'optimisation', 'optimization', 'cro', 'checkout', 'more orders', 'improve'],
      'Conversie en optimalisatie is op maat: we onderzoeken de route naar bestellen, rangschikken verbeteringen op impact en maken ze testbaar.',
      'Conversion optimisation is priced on request: we research the path to purchase, rank improvements by impact and make them testable.',
      [['Pakket conversie', 'Conversion package', '/pakketten/conversie-optimalisatie/'], ['Lees: conversie', 'Read: conversion', en ? '/inzichten/webshop-conversie/en/' : '/inzichten/webshop-conversie/']]],
    ['onderhoud', ['onderhoud', 'beheer', 'updates', 'bug', 'storing', 'hosting', 'uitbreiding'], ['maintenance', 'support', 'updates', 'bug', 'hosting'],
      'Onderhoud en uitbreiding kan als losse opdracht of als vaste afspraak, op maat: updates, back-ups, snelheid en nieuwe onderdelen.',
      'Maintenance and expansion can be a one-off job or an ongoing arrangement, priced on request: updates, backups, speed and new features.',
      [['Pakket onderhoud', 'Maintenance package', '/pakketten/onderhoud-uitbreiding/'], ['Boek een call', 'Book a call', BOEK]]],
    ['werkwijze', ['werkwijze', 'hoe werkt', 'proces', 'stappen', 'aanpak', 'planning', 'hoe lang', 'duurt', 'levertijd', 'snel', 'wanneer klaar', 'doorlooptijd', 'klaar'], ['process', 'how does it work', 'how it works', 'steps', 'approach', 'timeline', 'how long', 'delivery', 'when ready', 'take'],
      'In drie stappen: we bepalen samen het doel, je ziet eerst het mobiele ontwerp en na je akkoord bouwen en testen we, daarna gaan we live en meten we. De planning leggen we per opdracht vast in het voorstel.',
      'In three steps: we set the goal together, you see the mobile design first and after your approval we build and test, then we launch and measure. The timeline is agreed per project in the proposal.',
      [['Bekijk de werkwijze', 'How we work', '/werkwijze/'], ['Boek een call', 'Book a call', BOEK]]],
    ['werk', ['werk', 'cases', 'case', 'voorbeeld', 'voorbeelden', 'klanten', 'resultaat', 'resultaten', 'ellecera', 'scillasdotter', 'doggy', 'focus club', 'portfolio'], ['work', 'cases', 'case', 'example', 'examples', 'clients', 'results', 'ellecera', 'scillasdotter', 'doggy', 'focus club'],
      'Een selectie uit ons werk: ElleCera (meer dan 1.000 orders per week, 5,9% conversie), Scillasdotter (+148% afspraakaanvragen), Doggy & Cats (2.400+ klanten in vier maanden) en The Focus Club (+86% omzet).',
      'A selection of our work: ElleCera (over 1,000 orders a week, 5.9% conversion), Scillasdotter (+148% appointment requests), Doggy & Cats (2,400+ customers in four months) and The Focus Club (+86% revenue).',
      [['Bekijk ons werk', 'See our work', '/werk/'], ['Boek een call', 'Book a call', BOEK]]],
    ['contact', ['contact', 'bellen', 'call', 'gesprek', 'kennismaken', 'kennismaking', 'afspraak', 'spreken', 'mail', 'email', 'telefoon', 'bereiken', 'iemand'], ['contact', 'call', 'phone', 'talk', 'meeting', 'appointment', 'email', 'reach', 'someone', 'speak'],
      'Plan een kennismaking van 15 minuten aan de telefoon: kies zelf een moment. Mailen kan ook naar hello@webshopatelier.nl; we lezen berichten op werkdagen tussen 09.00 en 17.00 uur.',
      'Book a 15-minute introduction call and pick a time that suits you. You can also email hello@webshopatelier.nl; we read messages on working days between 09:00 and 17:00.',
      [['Boek een call', 'Book a call', BOEK], ['Mail ons', 'Email us', 'mailto:hello@webshopatelier.nl']]],
    ['ebook', ['e-book', 'ebook', 'gratis', 'nieuwsbrief', 'atelierpost', 'pdf', 'download'], ['e-book', 'ebook', 'free', 'newsletter', 'studio notes', 'pdf', 'download'],
      'Het gratis e-book “Het AI-team voor je webshop” krijg je bij Atelierpost: 22 taken die je vandaag uitbesteedt, 5 afdelingen en een opdrachtformule die je meteen gebruikt.',
      'Get the free e-book “The AI team for your store” with Studio notes: 22 tasks you can hand off today, 5 departments and a briefing formula you can use right away.',
      [['Stuur me het e-book', 'Send me the e-book', EBOOK]]],
    ['ai', ['ai-agent', 'chatbot', 'automatiseren', 'automatisering', 'klantenservice', 'klantmail', 'agent op maat'], ['ai agent', 'chatbot', 'automate', 'automation', 'customer service', 'support emails'],
      'Eén losse AI-agent voor één taak kan vanaf € 250, bijvoorbeeld klantvragen sorteren en een antwoord voorbereiden of productteksten maken. Het hele team is Atelier Commerce 360 vanaf € 1.499.',
      'A single AI agent for one task starts at €250, for example sorting customer questions and drafting replies, or writing product copy. The whole team is Atelier Commerce 360 from €1,499.',
      [['Pakket AI-agents', 'AI agents package', '/pakketten/ai-agents/'], ['Lees: de eerste AI-agent', 'Read: your first AI agent', en ? '/inzichten/ai-agent/en/' : '/inzichten/ai-agent/']]],
    ['over', ['over jullie', 'wie zijn', 'bedrijf', 'kvk', 'waar zitten', 'amsterdam', 'oprichter', 'founder'], ['about', 'who are you', 'company', 'where are you', 'amsterdam', 'founder'],
      'Webshopatelier is een atelier in Amsterdam voor websites, Shopify-webshops en AI-agents. KvK 98797298.',
      'Webshopatelier is a studio in Amsterdam for websites, Shopify stores and AI agents. Chamber of Commerce 98797298.',
      [['Over ons', 'About us', '/over-ons/'], ['Bedrijfsgegevens', 'Company details (NL)', '/bedrijfsgegevens/']]],
    ['groet', ['hoi', 'hallo', 'hey', 'goedemorgen', 'goedemiddag', 'dag'], ['hi', 'hello', 'hey', 'good morning'],
      'Hoi! Waar kan ik je mee helpen: prijzen, het AI-team, ons werk of een kennismaking?', 'Hi! What can I help with: prices, the AI team, our work or a call?', []],
  ];
  function norm(s) { return (' ' + s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9€+\- ]/g, ' ').replace(/\s+/g, ' ') + ' '); }
  function zoek(vraag) {
    var v = norm(vraag), best = null, score = 0;
    K.forEach(function (k) {
      var s = 0;
      (en ? k[2].concat(k[1]) : k[1].concat(k[2])).forEach(function (w) { var n = norm(w).trim(); if (!n) return; if (v.indexOf(' ' + n) > -1) s += n.indexOf(' ') > -1 ? 3 : (n.length > 4 ? 2 : 1); });
      if (k[0] === 'groet' && s && v.trim().split(' ').length > 3) s = 0;
      if (s > score) { score = s; best = k; }
    });
    return best;
  }
  // opbouw: titel, snelkeuze, invoer opnieuw (oude luisteraars eruit)
  var ph = c.querySelector('.ph9 small'); if (ph) ph.innerHTML = '<i></i>' + T.sub;
  var tb = c.querySelector('.ph9 b'); if (tb) tb.textContent = T.titel;
  var lijst = c.querySelector('.berichten'); lijst.setAttribute('aria-live', 'polite'); lijst.setAttribute('role', 'log');
  lijst.innerHTML = '';
  function msg(tekst, wie, knoppen) {
    var m = document.createElement('div'); m.className = 'msg' + (wie ? ' jij' : ''); m.textContent = tekst;
    if (knoppen && knoppen.length) { var p = document.createElement('div'); p.className = 'pillen'; knoppen.forEach(function (k) { var a = document.createElement('a'); a.className = 'chatknop11'; a.href = k[2]; a.textContent = en ? k[1] : k[0]; if (k[2] === BOEK) a.setAttribute('data-atelier-booking', ''); if (/^https?:/.test(k[2])) { a.target = '_blank'; a.rel = 'noopener'; } p.appendChild(a); }); m.appendChild(p); }
    lijst.appendChild(m); lijst.scrollTop = lijst.scrollHeight;
  }
  function snel() { var m = document.createElement('div'); m.className = 'msg'; m.textContent = T.hoi; var p = document.createElement('div'); p.className = 'pillen';
    T.snel.forEach(function (s) { var b = document.createElement('button'); b.type = 'button'; b.textContent = s[0]; b.addEventListener('click', function () { vraag(s[0], s[1]); }); p.appendChild(b); }); m.appendChild(p); lijst.appendChild(m); }
  function vraag(tekst, id) {
    msg(tekst, 1);
    var k = id ? K.filter(function (x) { return x[0] === id; })[0] : zoek(tekst);
    setTimeout(function () { if (k) msg(en ? k[4] : k[3], 0, k[5]); else msg(T.mis, 0, [['Boek een call', 'Book a call', BOEK], ['Mail ons', 'Email us', 'mailto:hello@webshopatelier.nl']]); }, 350);
  }
  snel();
  var oud = c.querySelector('.invoer9');
  if (oud) { var nieuw = oud.cloneNode(true); oud.parentNode.replaceChild(nieuw, oud); var inp = nieuw.querySelector('input'); if (inp) { inp.placeholder = T.plaats; inp.setAttribute('aria-label', T.plaats); }
    var sb = nieuw.querySelector('button'); if (sb) sb.setAttribute('aria-label', T.stuur);
    nieuw.addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value.trim(); if (!v) return; inp.value = ''; vraag(v); }); }
  var voet = c.querySelector('.paneel small.voet9, .paneel .demo'); if (voet) voet.textContent = T.voet;
  c.querySelectorAll('.paneel *').forEach(function (n) { if (n.childNodes.length === 1 && n.firstChild.nodeType === 3 && /AI kan fouten maken/.test(n.textContent)) n.textContent = T.voet; });
  var bub = c.querySelector('.bubbel'); if (bub && en) { var x = bub.querySelector('button'); bub.textContent = 'Hi, I’m the atelier minion. Ask me about the AI team, prices or a call.'; if (x) bub.prepend(x); }
  window.atelierChat = { zoek: function (t) { var k = zoek(t); return k ? k[0] : null; }, vraag: vraag };
})();
