/* Webshopatelier r13 (was boek12.js): "Volgende" staat na het kiezen van een tijd op een eigen regel onder de tijden, volle breedte.
   r12: de r10-kennismaakkaart met echte tijden uit de boekings-worker.
   Zelfde stappen als de live kiezer: dag, tijd, naam, e-mail, telefoon, bevestigen.
   Valt terug op Calendly als de worker niet antwoordt. Geen sleutels in deze code. */
(function () {
  var kaart = document.querySelector('[data-boek12]');
  var meta = document.querySelector('meta[name="atelier-booking-api"]');
  var api = meta ? meta.content.trim().replace(/\/+$/, '') : '';
  var en = (document.documentElement.lang || 'nl').indexOf('en') === 0;
  var CAL = 'https://calendly.com/hello-webshopatelier/kennismaking';
  var t = function (nl, eng) { return en ? eng : nl; };

  // knoppen "Boek een call" springen naar de kaart op deze pagina in plaats van naar contact
  function richtLinks() {
    if (!document.getElementById('boeken')) return;
    document.querySelectorAll('a[data-atelier-booking]').forEach(function (a) { a.setAttribute('href', '#boeken'); });
  }
  richtLinks(); window.addEventListener('load', function () { setTimeout(richtLinks, 0); });
  if (!kaart) return;

  var inhoud = kaart.querySelector('.inhoud9');
  var loc = t('nl-NL', 'en-GB');
  var fd = function (d, o) { return new Intl.DateTimeFormat(loc, Object.assign({ timeZone: 'Europe/Amsterdam' }, o)).format(d); };
  var sleutel = function (d) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); };
  var el = function (tag, cls, tekst) { var n = document.createElement(tag); if (cls) n.className = cls; if (tekst != null) n.textContent = tekst; return n; };
  var dagen = {}, volgorde = [], dag = null, tijd = null, velden = { name: '', email: '', phone: '' };

  function vandaag() { return sleutel(new Date()); }
  function plus(key, n) { var d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

  function terugval(bericht) {
    inhoud.innerHTML = '';
    inhoud.appendChild(el('h3', null, t('Kies een tijd', 'Choose a time')));
    inhoud.appendChild(el('p', 'demo', bericht));
    var a = el('a', 'knop', t('Open de agenda', 'Open the calendar')); a.href = CAL; a.target = '_blank'; a.rel = 'noopener';
    inhoud.appendChild(a);
  }

  function laad() {
    inhoud.innerHTML = ''; inhoud.appendChild(el('p', 'demo', t('Vrije tijden ophalen…', 'Checking availability…')));
    if (!api) { terugval(t('De agenda opent in een nieuw tabblad.', 'The calendar opens in a new tab.')); return; }
    var start = vandaag();
    Promise.all([start, plus(start, 7)].map(function (w) {
      return fetch(api + '/slots?start=' + encodeURIComponent(w), { credentials: 'omit', cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw Error('slots'); return r.json(); });
    })).then(function (lijsten) {
      var uniek = {};
      lijsten.forEach(function (data) { (data.slots || []).forEach(function (s) { var v = Date.parse(s && s.start_time); if (isFinite(v) && v > Date.now()) uniek[v] = 1; }); });
      dagen = {}; volgorde = [];
      Object.keys(uniek).map(Number).sort(function (a, b) { return a - b; }).forEach(function (v) {
        var d = new Date(v), k = sleutel(d); if (!dagen[k]) { dagen[k] = []; volgorde.push(k); } dagen[k].push(d);
      });
      if (!volgorde.length) { terugval(t('Deze twee weken zijn er geen vrije momenten.', 'There are no open times in the next two weeks.')); return; }
      dag = volgorde[0]; tijd = null; kies();
    }).catch(function () { terugval(t('De tijden laden nu niet.', 'Times could not be loaded right now.')); });
  }

  function kies() {
    inhoud.innerHTML = '';
    var kop = el('h3', null, fd(dagen[dag][0], { month: 'long', year: 'numeric' }).replace(/^./, function (c) { return c.toUpperCase(); }));
    kop.appendChild(el('small', null, 'Amsterdam')); inhoud.appendChild(kop);
    var wk = el('div', 'weekdag9'); (en ? ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] : ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']).forEach(function (d) { wk.appendChild(el('span', null, d)); });
    inhoud.appendChild(wk);
    var rail = el('div', 'dagen9'); rail.setAttribute('role', 'group'); rail.setAttribute('aria-label', t('Beschikbare dagen', 'Available dates'));
    var eerste = new Date(volgorde[0] + 'T12:00:00'), laatste = new Date(volgorde[volgorde.length - 1] + 'T12:00:00');
    var s = new Date(eerste); s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
    var e = new Date(laatste); e.setDate(e.getDate() + (6 - (e.getDay() + 6) % 7));
    for (var d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (dagen[key]) {
        (function (k) {
          var b = el('button'); b.type = 'button'; b.setAttribute('aria-pressed', k === dag ? 'true' : 'false');
          b.setAttribute('aria-label', fd(dagen[k][0], { weekday: 'long', day: 'numeric', month: 'long' }));
          b.appendChild(el('strong', null, fd(dagen[k][0], { day: 'numeric' })));
          b.addEventListener('click', function () { dag = k; tijd = null; kies(); rail = null; var p = inhoud.querySelector('.dagen9 [aria-pressed="true"]'); p && p.focus({ preventScroll: true }); });
          rail.appendChild(b);
        })(key);
      } else rail.appendChild(el('span', 'leeg', String(d.getDate())));
    }
    inhoud.appendChild(rail);
    var tg = el('div', 'tijden9'); tg.setAttribute('role', 'group'); tg.setAttribute('aria-label', t('Beschikbare tijden', 'Available times'));
    dagen[dag].forEach(function (d) {
      var w = el('div', 'tk' + (tijd && +tijd === +d ? ' gekozen' : ''));
      var b = el('button', null, fd(d, { hour: '2-digit', minute: '2-digit', hour12: false })); b.type = 'button';
      b.setAttribute('aria-pressed', tijd && +tijd === +d ? 'true' : 'false');
      b.addEventListener('click', function () { tijd = d; kies(); var g = inhoud.querySelector('.verder13'); g && g.focus({ preventScroll: true }); });
      w.appendChild(b); tg.appendChild(w);
    });
    inhoud.appendChild(tg);
    // r13: de knop krijgt een eigen regel onder de tijden, zodat hij nooit over een tijd heen valt
    if (tijd) {
      var v = el('button', 'knop verder13'); v.type = 'button';
      v.appendChild(el('span', null, t('Volgende', 'Next')));
      v.appendChild(el('small', null, fd(tijd, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + fd(tijd, { hour: '2-digit', minute: '2-digit', hour12: false })));
      v.addEventListener('click', formulier); inhoud.appendChild(v);
    }
  }

  function samenvatting() {
    return fd(tijd, { weekday: 'long', day: 'numeric', month: 'long' }) + t(' om ', ' at ') + fd(tijd, { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function formulier(melding) {
    inhoud.innerHTML = '';
    var tr = el('button', 'terug9', t('‹ Andere tijd', '‹ Another time')); tr.type = 'button'; tr.addEventListener('click', kies); inhoud.appendChild(tr);
    inhoud.appendChild(el('p', 'gekozen9', samenvatting()));
    if (typeof melding === 'string') inhoud.appendChild(el('p', 'melding9', melding));
    var f = el('form', 'form9');
    f.innerHTML = '<label>' + t('Naam', 'Name') + '<input name="name" autocomplete="name" maxlength="150" required></label>' +
      '<label>' + t('E-mail', 'Email') + '<input name="email" type="email" autocomplete="email" maxlength="254" required></label>' +
      '<label>' + t('Telefoon', 'Phone') + '<input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="40" pattern="[0-9 +]{8,}" placeholder="+31 6 12345678" title="' + t('Vul je telefoonnummer in, met landcode', 'Enter your phone number with country code') + '" required></label>' +
      '<button class="knop" type="submit">' + t('Plan het gesprek', 'Book the call') + '</button>';
    ['name', 'email', 'phone'].forEach(function (k) { var i = f.elements[k]; i.value = velden[k]; i.addEventListener('input', function () { velden[k] = i.value; }); });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      Array.prototype.forEach.call(f.elements, function (x) { x.disabled = true; });
      var knop = f.querySelector('.knop'); knop.textContent = t('Bezig met plannen…', 'Booking…');
      fetch(api + '/book', {
        method: 'POST', credentials: 'omit',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) },
        body: JSON.stringify({ name: velden.name.trim(), email: velden.email.trim(), phone: velden.phone.trim(), start_time: tijd.toISOString(), language: en ? 'en' : 'nl' })
      }).then(function (r) {
        if (r.status === 409) { laad(); return null; }
        if (r.status === 400 || r.status === 422) { formulier(t('Controleer je naam, e-mail en telefoonnummer met landcode.', 'Check your name, email and phone number with country code.')); return null; }
        if (r.status === 429) { terugval(t('Plan je gesprek via de agenda.', 'Please book through the calendar.')); return null; }
        return r.json().then(function (j) { if (!r.ok || j.confirmed !== true) throw Error('x'); return j; });
      }).then(function (j) {
        if (!j) return;
        inhoud.innerHTML = '';
        var b = el('div', 'bevestigd9'); b.appendChild(el('b', null, t('Staat genoteerd.', 'You’re booked.')));
        b.appendChild(el('p', null, t('We bellen je ', 'We’ll call you ') + samenvatting() + '.'));
        if (/^https:\/\/calendly\.com\/cancellations\/[a-zA-Z0-9-]+$/.test(j.cancel_url || '')) { var c = el('a', 'terug9', t('Afspraak annuleren', 'Cancel the call')); c.href = j.cancel_url; c.referrerPolicy = 'no-referrer'; b.appendChild(c); }
        inhoud.appendChild(b); velden = { name: '', email: '', phone: '' };
      }).catch(function () {
        inhoud.innerHTML = '';
        var b = el('div', 'bevestigd9'); b.appendChild(el('b', null, t('Bevestiging nog onbekend.', 'Confirmation pending.')));
        b.appendChild(el('p', null, t('Kijk in je mail of mail hello@webshopatelier.nl, dan voorkomen we een dubbele afspraak.', 'Check your email or write to hello@webshopatelier.nl so we avoid a double booking.')));
        inhoud.appendChild(b);
      });
    });
    inhoud.appendChild(f);
    setTimeout(function () { var n = f.elements.name; n && n.focus({ preventScroll: true }); }, 0);
  }

  // laden zodra de kaart binnen twee schermhoogtes komt (scroll en IntersectionObserver, wat het eerst komt)
  var gestart = false;
  function misschien() {
    if (gestart) return;
    var r = kaart.getBoundingClientRect();
    if (r.top < innerHeight * 2 && r.bottom > -innerHeight) { gestart = true; window.removeEventListener('scroll', misschien); laad(); }
  }
  window.addEventListener('scroll', misschien, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) misschien(); }, { rootMargin: '600px' }).observe(kaart);
  misschien();
})();
