(() => {
  const panel = document.getElementById('bericht');
  if (!panel || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    panel.classList.add('contact-arrived');
    observer.disconnect();
  }, {threshold: 0.12});
  observer.observe(panel);
})();
(() => {
  const form = document.getElementById('atelier-enquiry-form');
  if (!form) return;
  const button = form.querySelector('[type="submit"]');
  const feedback = form.querySelector('[role="status"]');
  const fallback = form.querySelector('.enquiry-fallback');
  const manualCopy = fallback.querySelector('textarea');
  const endpoint = form.getAttribute('action');
  const direct = endpoint.startsWith('/') && !endpoint.startsWith('//');
  const copy = (nl, en) => document.documentElement.lang.startsWith('en') ? en : nl;
  function compose() {
    const {name, email, message} = form.elements;
    return [message.value.trim(), '', name.value.trim(), email.value.trim()].join('\n');
  }
  fallback.querySelector('button').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(compose());
      feedback.textContent = copy('Gekopieerd. Plak je bericht in een mail aan hello@webshopatelier.nl.', 'Copied. Paste your message in an email to hello@webshopatelier.nl.');
    } catch {
      manualCopy.hidden = false;
      manualCopy.value = compose();
      manualCopy.select();
      feedback.textContent = copy('Kopieer de geselecteerde tekst.', 'Copy the selected text.');
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    for (const field of [form.elements.name, form.elements.message]) {
      field.value = field.value.trim();
    }
    if (!form.reportValidity()) return;
    feedback.textContent = '';
    if (!direct) {
      fallback.hidden = false;
      feedback.textContent = copy('Geen mailprogramma geopend? Kopieer je bericht en mail het naar hello@webshopatelier.nl.', 'No email app opened? Copy your message and email it to hello@webshopatelier.nl.');
      location.href = endpoint + '?subject=' + encodeURIComponent(copy('Vraag aan WebshopAtelier', 'Enquiry for WebshopAtelier')) + '&body=' + encodeURIComponent(compose());
      return;
    }
    if (button.disabled) return;
    button.disabled = true;
    try {
      const response = await fetch(endpoint, {
        method:'POST', body:new FormData(form), headers:{Accept:'application/json'}
      });
      const result = await response.json();
      if (!response.ok || result.sent !== true) throw Error('delivery');
      form.reset();
      fallback.hidden = true;
      feedback.textContent = copy('Je bericht is verstuurd. We reageren per e-mail.', 'Your message has been sent. We will reply by email.');
    } catch {
      fallback.hidden = false;
      feedback.textContent = copy('We konden de verzending niet bevestigen. Je tekst staat er nog. Mail je bericht naar hello@webshopatelier.nl.', 'Delivery could not be confirmed. Your message is still here. Email it to hello@webshopatelier.nl.');
    } finally { button.disabled = false; }
  });
})();
