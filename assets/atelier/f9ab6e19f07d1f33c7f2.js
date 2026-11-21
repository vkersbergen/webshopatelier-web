const afdelingen = [...document.querySelectorAll('.afdeling')];
const afdelingLinks = [...document.querySelectorAll('.afdeling-nav a, .org-branches a')];

function toonAfdeling(anker) {
  const gekozen = afdelingen.find(afdeling =>
    '#' + afdeling.id === anker || [...afdeling.querySelectorAll('.collega')].some(collega => '#' + collega.id === anker));
  if (!gekozen) return false;
  afdelingen.forEach(afdeling => { afdeling.hidden = afdeling !== gekozen; });
  afdelingLinks.forEach(link => {
    if (link.hash === '#' + gekozen.id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  return true;
}
afdelingLinks.forEach(link => link.addEventListener('click', () => toonAfdeling(link.hash)));
window.addEventListener('hashchange', () => toonAfdeling(location.hash));
if (!toonAfdeling(location.hash)) toonAfdeling('#' + afdelingen[0].id);

const vaardigheidZoekveld = document.querySelector('#vaardigheid-zoeken');
const vaardigheidCategorie = document.querySelector('#vaardigheid-categorie');
const vaardigheidKaarten = [...document.querySelectorAll('.vaardigheid-kaart')];
const vaardigheidTelling = document.querySelector('#vaardigheid-telling');
const meerWorkflows = document.querySelector('#meer-workflows');
const breedScherm = matchMedia('(min-width: 960px)');
let pagina = 1;

function werkVaardighedenBij() {
  const zoekwoorden = vaardigheidZoekveld.value.trim().toLocaleLowerCase('nl').split(/\s+/);
  const categorie = vaardigheidCategorie.value;
  const stap = breedScherm.matches ? 6 : 4;
  const limiet = pagina * stap;
  let gevonden = 0;
  vaardigheidKaarten.forEach(kaart => {
    const passend = (!categorie || kaart.dataset.categorie === categorie) &&
      zoekwoorden.every(woord => kaart.textContent.toLocaleLowerCase('nl').includes(woord));
    if (passend) gevonden += 1;
    kaart.hidden = !passend || gevonden > limiet;
  });
  meerWorkflows.hidden = gevonden <= limiet;
  vaardigheidTelling.textContent = gevonden === 0
    ? 'Geen workflows gevonden. Probeer een andere zoekterm of categorie.'
    : `${Math.min(gevonden, limiet)} van ${gevonden} workflows`;
}
function beginBijEersteWorkflows() {
  pagina = 1;
  werkVaardighedenBij();
}
vaardigheidZoekveld.addEventListener('input', beginBijEersteWorkflows);
vaardigheidCategorie.addEventListener('change', beginBijEersteWorkflows);
breedScherm.addEventListener('change', beginBijEersteWorkflows);
meerWorkflows.addEventListener('click', () => {
  const laatste = vaardigheidKaarten.filter(kaart => !kaart.hidden).at(-1);
  pagina += 1;
  werkVaardighedenBij();
  // Keep keyboard focus in the results when items are inserted before the button.
  vaardigheidKaarten.slice(vaardigheidKaarten.indexOf(laatste) + 1)
    .find(kaart => !kaart.hidden)?.querySelector('summary').focus({preventScroll:true});
});
werkVaardighedenBij();
