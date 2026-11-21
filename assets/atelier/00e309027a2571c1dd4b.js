const vaardigheidZoekveld = document.querySelector('#vaardigheid-zoeken');
const vaardigheidCategorie = document.querySelector('#vaardigheid-categorie');
const vaardigheidKaarten = [...document.querySelectorAll('.vaardigheid-kaart')];
const vaardigheidTelling = document.querySelector('#vaardigheid-telling');

function werkVaardighedenBij() {
  const zoekterm = vaardigheidZoekveld.value.trim().toLocaleLowerCase('nl');
  const categorie = vaardigheidCategorie.value;
  let aantal = 0;
  vaardigheidKaarten.forEach(kaart => {
    const zichtbaar = (!categorie || kaart.dataset.categorie === categorie) &&
      zoekterm.split(/\s+/).every(woord => kaart.textContent.toLocaleLowerCase('nl').includes(woord));
    kaart.hidden = !zichtbaar;
    if (zichtbaar) aantal += 1;
  });
  vaardigheidTelling.textContent = aantal === 0
    ? 'Geen vaardigheden gevonden. Pas je zoekterm of categorie aan.'
    : `${aantal} van ${vaardigheidKaarten.length} vaardigheden`;
}
vaardigheidZoekveld.addEventListener('input', werkVaardighedenBij);
vaardigheidCategorie.addEventListener('change', werkVaardighedenBij);
