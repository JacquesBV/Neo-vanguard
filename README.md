# NEO VANGUARD — pack GitHub Pages

Ce dossier est prêt à être publié à la **racine** du dépôt GitHub Pages du jeu. Il part du dernier `index.html` fourni et contient les corrections de sauvegarde et la nouvelle musique d'accueil.

## Contenu

- `index.html` — jeu complet : HTML, CSS, JavaScript, illustrations **et musique d’accueil embarqués**. Il fonctionne seul, même dans un aperçu qui ne charge pas les fichiers voisins. **Remplace l'ancien `index.html` du dépôt.**
- `music/title.mp3` — copie séparée de **L’Éveil**, la musique instrumentale originale douce et mythique, utile pour l’écouter ou l’archiver. Le jeu n'a plus besoin de charger ce fichier pour les deux premiers écrans.
- `UPDATE.md` — détail des changements.
- `.nojekyll` — évite un traitement Jekyll inutile sur GitHub Pages.
- `music/README.md` — liste des autres musiques facultatives.

## Publier sur GitHub

1. Faites une copie de l'ancien `index.html` du dépôt si vous souhaitez pouvoir revenir en arrière.
2. Décompressez l'archive `neo-vanguard-github.zip`. **Ne déposez pas le ZIP tel quel sur GitHub : GitHub Pages ne le décompresse pas.**
3. Ouvrez **le contenu** du dossier `neo-vanguard-github` et envoyez-le à la racine du dépôt, au même endroit que l'actuel `index.html`. Remplacez le fichier existant. `music/title.mp3` est fourni en copie séparée, mais le thème est aussi intégré dans `index.html` : il joue donc même si ce fichier audio séparé n'est pas chargé. Si vous avez déjà d'autres fichiers MP3 dans le dépôt, ne les effacez pas.
4. Dans **Settings → Pages**, gardez le réglage de publication existant s'il fonctionne. Sinon sélectionnez la branche publiée (souvent `main`) et **`/ (root)`**.
5. Attendez le déploiement, puis rechargez le site. Sur téléphone, si l'ancien son persiste, ouvrez le site en navigation privée ou videz le cache de la page.

La progression du jeu est stockée dans le navigateur (`localStorage`), pas sur GitHub : remplacer les fichiers n'efface normalement pas les sauvegardes conservées sur la même adresse.

## Son sur mobile

Les navigateurs mobiles peuvent **interdire la lecture automatique avant le premier toucher**. Le jeu essaie de lancer la musique dès l'affichage ; si le navigateur le refuse, le premier toucher sur « Appuyer pour entrer » démarre **L’Éveil** et le laisse jouer quelques secondes sur cet écran avant d'ouvrir le menu. Ce thème continue ensuite sur le menu, sans bruit de fond ni effets de navigation. Le réglage de volume et la sourdine du jeu s'appliquent toujours.

Les dix autres MP3 facultatifs n'étaient pas dans les fichiers reçus. Le jeu utilise son audio synthétique de repli lorsqu'ils manquent ; voir `music/README.md`.

## FanBoy FX portrait (secteurs 1 à 4)

Le terrain utilise le référentiel vertical 480 × 860. Les sprites et les quatre encres LCD du moteur sont conservés. La coque reprend les matériaux de la maquette fournie dans un atlas : seuls le métal, les bordures et les commandes sont échantillonnés ; aucune image de gameplay de la maquette n'est affichée. Les sticks et boutons sont redessinés séparément, avec déplacement et enfoncement interpolés dans la boucle de rendu existante.

Le HUD occupe la coque au-dessus et au-dessous du terrain. Les LED passent du vert à l'orange à mi-secteur, puis au rouge avant le boss ; le warning utilise le même signal de clignotement. L'écran se cale sur des multiples entiers de pixels physiques : sa hauteur dépend du téléphone (environ 77 % sur 430 × 932), sans étirer ni rogner le jeu. Le pilotage relatif, la bombe à deux doigts et les zones tactiles restent disponibles ; les cibles de bombe, pause et changement d'arme sont superposées à la coque.

Validation navigateur : servir le dépôt sur un serveur HTTP local puis lancer `GAME_URL=http://127.0.0.1:8876 node tests/fanboy.browser.cjs` (syntaxe des variables à adapter au terminal). Playwright et Microsoft Edge sont nécessaires ; `PLAYWRIGHT_MODULE`, `BROWSER_CHANNEL` et `OUTPUT_DIR` sont configurables. Les tests couvrent les quatre secteurs sur PC et mobile simulé, le tactile relatif, les entrées clavier/manette, le relâchement, les LED/warning, les ratios 320 × 568 à 430 × 932, la pause et le retour à la génération suivante. Les captures et le rapport sont écrits dans `outputs/` par défaut.
