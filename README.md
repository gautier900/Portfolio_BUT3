# Portfolio « Ma playlist »

Portfolio de présentation (BUT Informatique, 3e année), codé en HTML, CSS et JavaScript, sans framework ni dépendance.

Le thème : le site est une **playlist**. La barre de lecture fixe en bas de l'écran sert de menu flottant :

- **la barre de progression** suit le défilement de la page, et on peut la faire glisser pour s'y déplacer ;
- **les boutons ⏮ et ⏭** passent d'une section à l'autre ;
- **le bouton ⏯** met en pause les animations (utile pour l'accessibilité).

## Arborescence

```
index.html        contenu de toutes les sections
css/style.css     styles (thèmes clair et sombre, responsive)
js/main.js        lecteur, menu, fiches projet, formulaire
assets/           cv.pdf, favicon.svg, photos…
```

## Modifier le contenu

Tous les textes à remplacer sont marqués `TODO contenu` dans `index.html`.

- **Projets** : chaque projet est un `<li class="track">`. La ligne visible est dans `.track__btn`, la fiche détaillée (ouverte au clic) dans `.track__details`. Changer `data-hue` (0 à 360) modifie la couleur de la pochette.
- **CV** : remplacer `assets/cv.pdf` en gardant le même nom de fichier.
- **Pochettes du fond de l'accueil** : déposer des images carrées (environ 300 × 300 px, en `.webp` ou `.jpg`, moins de 40 Ko chacune) dans `assets/albums/`, puis lister leurs noms dans le tableau `ALBUMS` en haut de `js/main.js`. Une image introuvable est remplacée automatiquement par une pochette générée.
- **Photo** : ajouter `assets/photo.webp` et remplacer le bloc `.placeholder-photo`.

## Formulaire de contact

GitHub Pages n'exécute pas de code serveur. Le formulaire passe donc par [Formspree](https://formspree.io) (gratuit) :

1. Créer un formulaire sur Formspree.
2. Remplacer `VOTRE_ID` dans l'attribut `action` du `<form>`.

Tant que l'identifiant n'est pas renseigné, le formulaire ouvre le logiciel de messagerie du visiteur avec le message prérempli.

## Lancer en local

```bash
python3 -m http.server 5173
```

Puis ouvrir http://localhost:5173.

## Déployer sur GitHub Pages

1. Pousser le dossier sur un dépôt GitHub.
2. Dans *Settings → Pages*, choisir la branche `main` et le dossier `/ (root)`.
3. Facultatif : ajouter un nom de domaine personnalisé (fichier `CNAME`).
