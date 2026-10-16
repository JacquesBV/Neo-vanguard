# FICHE DE PRÉSENTATION DU DÉPÔT — à copier-coller

Tout ce qui suit est prêt à coller dans GitHub. Les champs se remplissent dans
l'ordre : **About** (colonne de droite du dépôt), **Settings → General** (aperçu
social), **Settings → Pages**, puis l'onglet **Releases**.

Dépôt : <https://github.com/JacquesBV/Neo-vanguard> · Glisser-déposer :
<https://github.com/JacquesBV/Neo-vanguard/upload/main>

---

## 1. Description du dépôt (colonne de droite → ⚙ About → Description)

> Champ limité à **350 caractères**. Version courte (recommandée) :

```
Shoot them up vertical rétro-évolutif : le moteur graphique change de génération à chaque secteur — Pocket, 8 bits, 16 bits, arcade, CD-ROM, HD WebGL. Six secteurs, un seul fichier HTML, jouable au clavier, à la souris ou au doigt.
```

*Variante plus factuelle, si tu préfères :*

```
6 secteurs, 6 moteurs de rendu : Pocket 160×144 (4 teintes), 8 bits, 16 bits, arcade, CD-ROM 32 bits, HD WebGL temps réel. Moteur maison, pixel-art procédural, chiptune WebAudio. Fichier index.html unique, sans CDN.
```

## 2. Site web (About → Website)

```
https://jacquesbv.github.io/Neo-vanguard/
```

## 3. Topics / Sujets (About → ⚙ → Topics)

À coller un par un (GitHub en accepte 20 ; ceux-ci sont pertinents et recherchés) :

```
shoot-em-up  shmup  shoot-them-up  pixel-art  retro  arcade  webgl  chiptune
webgl  pixijs  canvas  javascript  html5-game  browser-game  retro-gaming
procedural-generation  chiptune  webaudio  single-file  game-dev
```

## 4. Aperçu social (Settings → General → Social preview)

Téléverser **`banniere-neo-vanguard.png`** (1280×640, fourni dans le zip).
C'est l'image qui s'affiche quand on partage l'adresse du dépôt sur Discord,
X, Reddit, LinkedIn, Slack ou WhatsApp.

## 5. Bandeau de la page d'accueil (README)

Déjà installé : les deux premières lignes de `README.md` affichent
`bandeau-readme.png` (1280×360) et le lien « ▶ Jouer en ligne ». Le fichier
`bandeau-readme.png` doit donc être **à la racine du dépôt**, à côté de
`index.html`.

## 6. Première version (onglet Releases → Draft a new release)

- **Choose a tag** : `v1.0.0` → *Create new tag*
- **Release title** :

```
NEO VANGUARD v1.1 — 6 secteurs, 6 générations graphiques
```

- **Describe this release** :

```markdown
Première version publiée du jeu complet.

**Les 6 générations de rendu**
- **Secteur 1 — Kodama Pocket (KDM-01)** : 160×144, 4 teintes imposées, trames ordonnées, aucun dégradé.
- **Secteur 2 — 8 bits+ (Kodama Home System)** : 16 couleurs, parallaxe sur deux plans, sprites animés.
- **Secteur 3 — 16 bits (Kodama Super 16 / Vega Neon Drive)** : palette étendue, transparences, particules, boss à plusieurs phases.
- **Secteur 4 — arcade (Arcadia, shockbox)** : 32 teintes, grosses sprites, salle d'arcade, monnayeurs,
  balayage CRT et dérive de teinte magenta — le seul secteur qui « passe à la borne ».
- **Secteur 5 — 32 bits CD-ROM (Nova CD)** : résolution interne réduite, tramage ordonné
  4×4, brouillard de portée, monolithes de données : la génération CD assumée, sans lissage.
- **Secteur 6 — HD temps réel** : rendu WebGL 2, bloom, aberration chromatique, flou de mouvement,
  particules sur le GPU (4 000 max), poses cuites (4 par sprite), étalonnage par table de couleurs.

**Le reste**
- 7 chasseurs et 5 armes achetables en boutique, 4 boss (rejoués en MK-2 aux secteurs 5 et 6),
  11 types d'ennemis dont la mine arcade et le tireur embusqué, 6 livrées, 4 traînées, 5 auras.
- **Une introduction de quatre pages** au lancement d'une campagne, et **la boîte de jeu du secteur**
  qui s'annonce quatre secondes avant chaque niveau (jaquette, cartouche, disque — selon la console).
- 9 circuits musicaux, un par secteur et par fin, générés en WebAudio.
- Une seule page : `index.html`, 848 Ko, **aucun CDN, aucune requête réseau** — sprites, décors,
  palettes, musiques et bruitages générés par le code au démarrage.
- Clavier (flèches / ZQSD / WASD), souris et **tactile** : le doigt **pousse** le vaisseau (commande
  relative, aucune attraction vers le point touché), barre ARME / BOMBE, bombe à deux doigts.
- 8 codes triches dans le panneau **CODES** — le maître est `kabrak77`.
- Textes en français.

**À vérifier**
- Chrome / Edge / Firefox / Safari récents, ordinateur et téléphone.
- Plein écran : touche `F`. Couper le son : `M`.
```

## 7. Licence (Settings → General → Licence) — au choix

- **Aucune** (par défaut) : tous droits réservés, personne ne peut réutiliser le code.
- **MIT** : réutilisation libre, y compris commerciale, à condition de garder ton nom.
  Pour un jeu que tu veux voir circuler et être crédité, c'est le choix habituel.
- Dis-le moi si tu veux que je génère le fichier `LICENSE` correspondant et que je
  l'ajoute au zip.

## 8. Contrôle final, dans l'ordre

1. Le dépôt affiche : bandeau, description, lien du site, sujets, `index.html`, `README.md`.
2. Cliquer sur le lien du site : **https://jacquesbv.github.io/Neo-vanguard/** → le jeu démarre.
3. **Ctrl+F5**, puis `F12` → onglet Console : **plus aucune erreur `404 /cdn-cgi/...`**
   (c'était le résidu de la version téléchargée par proxy, corrigé par le `index.html` du zip).
4. Dans le jeu : MENU CHEAT → taper `kabrak77` → « CODE ACCEPTÉ — VIES INFINIES ».
5. Mettre l'adresse dans Discord ou X : l'aperçu social doit montrer la bannière.
6. Recherche GitHub : taper `shmup retro webgl` — le dépôt doit ressortir grâce aux sujets.
