(() => {
  const links = document.querySelectorAll('a[data-atelier-booking]');
  if (!links.length || typeof HTMLDialogElement === 'undefined') return;
  links.forEach(link => {
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
