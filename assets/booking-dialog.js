(() => {
  const links = document.querySelectorAll('a[data-atelier-booking]');
  if (!links.length) return;
  const api = document.querySelector('meta[name="atelier-booking-api"]')?.content.trim().replace(/\/+$/, '');
  const section = document.querySelector('#boeken .atelier-call-card');
  if (api && section) initAtelierBooking(section, api);
  if (typeof HTMLDialogElement === 'undefined') return;
  links.forEach(link => {
    if (api && !link.closest('#boeken')) {
      link.href = '/contact/#boeken';
      return;
    }
    link.setAttribute('aria-haspopup','dialog');
    link.addEventListener('click',event=>{
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const modal=document.createElement('dialog');
      if (typeof modal.showModal !== 'function') return;
      event.preventDefault();
      const english=document.documentElement.lang.startsWith('en');
      modal.id='call-calendar-modal';
      modal.setAttribute('aria-labelledby','call-modal-title');
      modal.innerHTML='<div class="call-modal-head"><h2 id="call-modal-title"></h2><button type="button" autofocus>×</button></div><iframe></iframe><div class="call-modal-foot"><a target="_blank" rel="noopener"></a></div>';
      const frame=modal.querySelector('iframe');
      const title=english?'Choose a time':'Kies een tijd';
      modal.querySelector('h2').textContent=title;
      const close=modal.querySelector('button');
      close.setAttribute('aria-label', english?'Close calendar':'Agenda sluiten');
      close.addEventListener('click',()=>modal.close());
      const fallback=modal.querySelector('a');
      fallback.href=link.href;
      fallback.textContent=english?'Open Calendly in a new tab ↗':'Open Calendly in een nieuw tabblad ↗';
      const requestCall=document.createElement('a');
      requestCall.href='/contact/#bericht';
      requestCall.textContent=english?'Request a call via the contact form':'Vraag een belafspraak aan via het formulier';
      requestCall.addEventListener('click',()=>modal.close());
      fallback.before(requestCall);
      frame.title=english?'Book your introductory call with WebshopAtelier':'Boek je kennismaking met WebshopAtelier';
      const url=new URL(link.href);
      if(location.hostname)url.searchParams.set('embed_domain',location.hostname);
      url.searchParams.set('embed_type','Inline');
      url.searchParams.set('hide_event_type_details','1');
      modal.addEventListener('close',()=>{modal.remove();link.focus({preventScroll:true})},{once:true});
      modal.addEventListener('click',e=>{
        if(e.target!==modal)return;
        const r=modal.getBoundingClientRect();
        if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();
      });
      document.body.append(modal);
      modal.showModal();
      frame.src=url.href;
    });
  });
})();

document.querySelectorAll('.call-mail-options [data-copy-mail]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const address = button.parentElement.querySelector('a');
    const status = button.parentElement.querySelector('[role="status"]');
    const english = document.documentElement.lang.startsWith('en');
    try {
      await navigator.clipboard.writeText(address.textContent.trim());
      status.textContent = english ? 'Copied.' : 'Gekopieerd.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(address);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = english ? 'Copy the selected address.' : 'Kopieer het geselecteerde adres.';
    }
  });
});

function initAtelierBooking(card, api) {
  const actions = card.querySelector('.atelier-call-actions');
  const fallback = actions?.querySelector('[data-atelier-booking]');
  if (!fallback) return;
  const t = (nl, en) => document.documentElement.lang.startsWith('en') ? en : nl;
  const dateFormat = (date, options) => new Intl.DateTimeFormat(t('nl-NL', 'en-GB'), {
    timeZone: 'Europe/Amsterdam', ...options
  }).format(date);
  const time = date => dateFormat(date, {hour:'2-digit', minute:'2-digit', hour12:false});
  const dayFormatter = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'});
  const dayKey = date => dayFormatter.format(date);
  const noon = key => new Date(key + 'T12:00:00Z');
  const move = (key, days) => {
    const date = noon(key);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0,10);
  };
  const today = () => dayKey(new Date());
  let week = today(), days = new Map(), selectedDay, selectedTime, stage = 'start';
  let fields = {name:'', email:'', phone:''};
  let notice = '', attempt = 0;
  const region = document.createElement('section');
  region.className = 'booking-picker';
  region.setAttribute('aria-label', t('Plan je kennismaking','Schedule your call'));
  const status = document.createElement('p');
  status.className = 'booking-status';
  status.setAttribute('role','status');
  const content = document.createElement('div');
  region.append(status,content);
  actions.before(region);
  card.classList.add('has-inline-booking');

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function button(label, fn, className) {
    const control = element('button',label,className);
    control.type = 'button';
    control.addEventListener('click',fn);
    return control;
  }
  function focusHeading() {
    const target = content.querySelector('h3');
    if (target) { target.tabIndex = -1; target.focus({preventScroll:true}); }
  }
  function showFallback(show) { fallback.hidden = !show; }
  function summary() {
    return dateFormat(new Date(selectedTime),{weekday:'long',day:'numeric',month:'long',year:'numeric'}) +
      ' · ' + time(new Date(selectedTime)) + ' (Amsterdam)';
  }
  function renderPicker(focusGroup) {
    stage = 'choose';
    content.replaceChildren();
    status.textContent = notice;
    const firstDay = days.keys().next().value || week;
    const title = dateFormat(noon(firstDay),{month:'long',year:'numeric'});
    const heading = element('h3',title.charAt(0).toUpperCase()+title.slice(1));
    const top = element('div',null,'booking-top');
    top.append(heading,element('small','Amsterdam'));
    content.append(top);
    if (days.size) {
      const rail = element('div',null,'booking-days');
      rail.setAttribute('role','group');
      rail.setAttribute('aria-label',t('Beschikbare dagen','Available dates'));
      for (const key of days.keys()) {
        const date = noon(key);
        const b = button('',() => {
          selectedDay = key;
          selectedTime = days.get(key)[0];
          renderPicker('.booking-days');
        });
        b.setAttribute('aria-label',dateFormat(date,{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
        b.setAttribute('aria-pressed',String(key===selectedDay));
        b.append(element('small',dateFormat(date,{weekday:'short'})),element('strong',dateFormat(date,{day:'numeric'})));
        rail.append(b);
      }
      const times = element('div',null,'booking-times');
      times.setAttribute('role','group');
      times.setAttribute('aria-label',t('Beschikbare tijden','Available times'));
      for (const iso of days.get(selectedDay)) {
        const date = new Date(iso);
        const b = button(time(date),() => { selectedTime = iso; renderPicker('.booking-times'); });
        b.setAttribute('aria-pressed',String(iso===selectedTime));
        b.setAttribute('aria-label',dateFormat(date,{hour:'2-digit',minute:'2-digit',timeZoneName:'shortOffset'}));
        times.append(b);
      }
      const next = button(t('Verder met ', 'Continue with ') + time(new Date(selectedTime)),() => {
        notice = ''; renderDetails(); focusHeading();
      },'booking-action');
      content.append(rail,times,next);
    } else {
      content.append(element('p',t('Deze week zijn er geen vrije momenten.','There are no times available this week.')));
    }
    const pages = element('div',null,'booking-week-nav');
    const previous = button(t('Vorige week','Previous week'),() => load(move(week,-7),true));
    previous.disabled = week<=today();
    pages.append(previous,button(t('Volgende week','Next week'),() => load(move(week,7),true)));
    content.append(pages);
    if (focusGroup) content.querySelector(focusGroup+' [aria-pressed="true"]')?.focus({preventScroll:true});
  }
  async function load(start, focus = false) {
    const sequence = ++attempt;
    stage = 'loading'; week = start<today() ? today() : start;
    content.replaceChildren();
    status.textContent = t('Beschikbare tijden ophalen…','Checking availability…');
    try {
      const response = await fetch(api+'/slots?start='+encodeURIComponent(week), {credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});
      if (!response.ok) throw Error('slots');
      const data = await response.json();
      if (!Array.isArray(data.slots)) throw Error('slots');
      if (attempt!==sequence) return;
      days = new Map();
      const unique = new Set();
      for (const slot of data.slots) {
        const value = Date.parse(slot?.start_time);
        if (Number.isFinite(value) && value>Date.now()) unique.add(value);
      }
      const limit = move(week,7);
      for (const value of [...unique].sort((a,b)=>a-b)) {
        const date = new Date(value), key = dayKey(date);
        if (key<week || key>=limit) continue;
        if (!days.has(key)) days.set(key,[]);
        days.get(key).push(date.toISOString());
      }
      selectedDay = days.keys().next().value;
      selectedTime = days.get(selectedDay)?.[0];
      showFallback(false); renderPicker();
      if (focus) focusHeading();
    } catch {
      if (attempt!==sequence) return;
      stage = 'error'; showFallback(true);
      status.textContent = t('De tijden kunnen nu niet worden opgehaald. Probeer opnieuw of open de agenda hieronder.','Availability is temporarily unavailable. Try again or open the calendar below.');
      content.append(button(t('Opnieuw proberen','Try again'),()=>load(week,true),'booking-action'));
    }
  }
  function renderDetails() {
    stage = 'details'; status.textContent = notice; content.replaceChildren();
    const form = element('form',null,'booking-fields');
    form.append(element('h3',t('Jouw belafspraak','Your call')),element('p',summary()));
    for (const [key,title,type,autocomplete,maxLength] of [
      ['name',t('Naam','Name'),'text','name',150],['email',t('E-mailadres','Email address'),'email','email',254],
      ['phone',t('Telefoonnummer met landcode','Phone number with country code'),'tel','tel',40]
    ]) {
      const label = element('label',title);
      const input = element('input');
      Object.assign(input,{type,name:key,autocomplete,required:true,maxLength,value:fields[key]});
      if (key==='phone') input.placeholder='+31 6 12345678';
      input.addEventListener('input',()=>{fields[key]=input.value});
      label.append(input); form.append(label);
    }
    const submit = element('button',t('Bevestig belafspraak','Confirm call'),'booking-action');
    submit.type = 'submit';
    form.append(submit,button(t('Ander moment kiezen','Choose another time'),()=>{
      notice = ''; load(week,true);
    },'booking-back'));
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if (stage!=='details') return;
      const values = new FormData(form);
      fields = Object.fromEntries(['name','email','phone'].map(key=>[key,String(values.get(key)||'').trim()]));
      stage = 'sending';
      for (const input of form.elements) input.disabled = true;
      status.textContent = t('Je afspraak wordt geboekt…','Booking your call…');
      try {
        const result = await fetch(api+'/book',{
          method:'POST', credentials:'omit', signal:AbortSignal.timeout(30000),
          headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},
          body:JSON.stringify({...fields,start_time:selectedTime,language:t('nl','en')})
        });
        if (result.status===409) {
          notice = t('Dit moment is net bezet. Kies een nieuw tijdstip.','This time has just been taken. Choose another.');
          await load(week,true); return;
        }
        if (result.status===400 || result.status===422) {
          notice = t('Controleer je naam, e-mailadres en telefoonnummer, inclusief landcode.','Check your name, email and phone number, including country code.');
          renderDetails(); focusHeading(); return;
        }
        if (!result.ok || (await result.json()).confirmed!==true) throw Error('unconfirmed');
        stage = 'confirmed'; status.textContent = ''; content.replaceChildren();
        content.append(element('h3',t('Je belafspraak staat gepland.','Your call is booked.')),element('p',summary()));
        fields = {name:'',email:'',phone:''}; focusHeading();
      } catch {
        stage = 'unknown'; status.textContent = ''; content.replaceChildren();
        content.append(element('h3',t('Bevestiging nog onbekend','Confirmation pending')),element('p',t(
          'Controleer eerst je e-mail of vraag ons of de afspraak is vastgelegd. Zo voorkom je een dubbele boeking.',
          'Check your email or ask us to verify the booking before trying again.')));
        const contact = element('a',t('Neem contact op','Contact us'),'booking-back');
        contact.href='/contact/#bericht'; content.append(contact); focusHeading();
      }
    });
    content.append(form);
  }
  const observe = new IntersectionObserver(entries=>{
    if (entries.some(entry=>entry.isIntersecting)) { observe.disconnect(); load(week); }
  },{rootMargin:'120px'});
  observe.observe(card);
  new MutationObserver(()=>{
    if (stage==='choose') { notice=''; renderPicker(); }
    if (stage==='details') { notice=''; renderDetails(); }
    region.setAttribute('aria-label',t('Plan je kennismaking','Schedule your call'));
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
