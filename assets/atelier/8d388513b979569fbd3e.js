const commerceMenu = document.querySelector('#mega');
const commerceMenuKnoppen = [...document.querySelectorAll('#menu, #mega-trigger')];
const commerceMenuLaag = document.querySelector('#menu-scrim');
const commerceTalen = document.querySelector('#kop-talen');
const commerceTaalKnoppen = [...document.querySelectorAll('[data-menu-taal]')];
const commerceVertalingen = [...document.querySelectorAll('body > header [data-en], body > footer [data-en]')];
const commerceNederlandseLabels = commerceVertalingen.map(element => element.textContent);
let commerceMenuOpener;
let commerceEngels = false;

function zetCommerceMenu(open) {
  commerceMenu.hidden = !open;
  commerceMenuLaag.hidden = !open;
  commerceMenuKnoppen.forEach(knop => knop.setAttribute('aria-expanded', String(open)));
}

commerceMenuKnoppen.forEach(knop => {
  knop.addEventListener('click', () => {
    commerceMenuOpener = knop;
    commerceTalen.open = false;
    zetCommerceMenu(commerceMenu.hidden);
  });
  knop.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    commerceMenuOpener = knop;
    zetCommerceMenu(true);
    commerceMenu.querySelector('button').focus();
  });
});
commerceMenuLaag.addEventListener('click', () => zetCommerceMenu(false));
commerceMenu.addEventListener('click', event => {
  if (event.target.closest('a')) zetCommerceMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!commerceMenu.hidden) {
    zetCommerceMenu(false);
    commerceMenuOpener?.focus();
  } else if (commerceTalen.open) {
    commerceTalen.open = false;
    commerceTalen.querySelector('summary').focus();
  }
});
document.addEventListener('pointerdown', event => {
  if (!commerceTalen.contains(event.target)) commerceTalen.open = false;
});

function commerceKiesTaal(land) {
  const keuze = commerceTaalKnoppen.find(knop => knop.dataset.land === land);
  if (!keuze) return;
  commerceEngels = land === 'GB';
  document.documentElement.lang = keuze.lang;
  document.querySelector('#taal-indicator').textContent = keuze.querySelector('span').textContent;
  commerceTaalKnoppen.forEach(knop => knop.setAttribute('aria-pressed', String(knop.dataset.land === land)));
  commerceVertalingen.forEach((element, index) => {
    element.textContent = commerceEngels ? element.dataset.en : commerceNederlandseLabels[index];
  });
}
try { commerceKiesTaal(localStorage.getItem('atelier-taal')); } catch {}
commerceTaalKnoppen.forEach(knop => knop.addEventListener('click', () => {
  commerceKiesTaal(knop.dataset.land);
  try { localStorage.setItem('atelier-taal', knop.dataset.land); } catch {}
  commerceTalen.open = false;
}));

document.querySelector('#newsletter').addEventListener('submit', event => {
  event.preventDefault();
  const mail = new FormData(event.currentTarget).get('email');
  const onderwerp = commerceEngels ? 'Studio updates' : 'Atelier-updates';
  const bericht = commerceEngels ? 'Please send updates to ' : 'Ik ontvang graag updates op ';
  location.href = 'mailto:hello@webshopatelier.nl?subject=' + encodeURIComponent(onderwerp) + '&body=' + encodeURIComponent(bericht + mail);
  document.querySelector('#news-status').textContent = commerceEngels
    ? 'Send the message from your mail app to sign up.'
    : 'Verstuur het bericht vanuit je mailprogramma om je aan te melden.';
});
