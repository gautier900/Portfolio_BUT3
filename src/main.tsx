// Interactions du site (lecteur, menu, fiches projet, formulaire), inchangées
import '../js/main.js';

// Composants React (shadcn / Skiper UI) : React n'est téléchargé
// que si la page contient au moins un emplacement data-island.
if (document.querySelector('[data-island]')) {
  import('./islands').then(({ mountIslands }) => mountIslands());
}
