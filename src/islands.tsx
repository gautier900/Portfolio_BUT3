import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

/* =========================================================
   Îlots React : composants shadcn / Skiper UI posés dans la page HTML
   =========================================================
   Le site reste en HTML/CSS/JS ; seuls les emplacements marqués
   data-island sont rendus par React.

   1. npx shadcn add @skiper-ui/skiper40      → crée le fichier dans src/components/
   2. l'importer ici et l'ajouter à `islands` :
        import { Skiper40 } from '@/components/ui/skiper-ui/skiper40';
        const islands = { skiper40: Skiper40 };
   3. dans index.html, à l'endroit voulu :
        <div data-island="skiper40"></div>
      Props facultatives en JSON : <div data-island="skiper40" data-props='{"titre":"Projets"}'></div>
*/
const islands: Record<string, ComponentType<any>> = {};

export function mountIslands() {
  document.querySelectorAll<HTMLElement>('[data-island]').forEach((el) => {
    const name = el.dataset.island ?? '';
    const Component = islands[name];
    if (!Component) {
      console.warn(`Îlot React inconnu : « ${name} » (à déclarer dans src/islands.tsx)`);
      return;
    }
    let props: Record<string, unknown> = {};
    if (el.dataset.props) {
      try {
        props = JSON.parse(el.dataset.props);
      } catch {
        console.warn(`data-props invalide sur l'îlot « ${name} » (JSON attendu)`);
      }
    }
    createRoot(el).render(
      <StrictMode>
        <Component {...props} />
      </StrictMode>,
    );
  });
}
