# Validation NV-01 — 25 octobre 2026 (proposition détaillée v2, locale)

Test navigateur : `fanboy.browser.cjs` (Node.js + Playwright, Microsoft Edge).
Servir la racine du dépôt sur `http://127.0.0.1:8765`, puis lancer
`node tests/fanboy.browser.cjs`. `GAME_URL`, `PLAYWRIGHT_MODULE` et
`BROWSER_CHANNEL` permettent de changer le serveur, le module ou le navigateur.
Les captures et le rapport sont écrits dans `outputs/` du répertoire de travail.

Vérifié :

- Secteurs 1, 2, 3 et 4 à 1440 × 1000 et en émulation tactile 390 × 844,
  DPR 2. Ouverture 4:3, coque entièrement visible, cadrage stable.
- Clavier : déplacement et tir maintenus, puis relâchement.
- Manette simulée : axes et tir transmis au même état visuel.
- Tactile : déplacement relatif par événements tactiles du navigateur.
- Bombe ponctuelle : enfoncement puis relâchement après 140 ms de simulation.
- LED verte, orange, rouge et WARNING : inspection des captures.
- Dix échantillons de phase/enveloppe identiques entre cadre et bannière
  par secteur et par format ; aucune erreur JavaScript.
- Secteur 5 : retour au référentiel 480 × 860 et au cadre de sa génération.
- Rotation mobile : coque entière visible en 844 × 390.
- Analyse syntaxique des quatre modules modifiés et `git diff --check`.

Mesure locale de 100 dessins de coque dans Edge sans interface : médiane
0,10 ms, percentile 95 de 0,30 ms. Cette mesure porte sur la coque, pas sur
les performances complètes du jeu ni sur un téléphone physique.

La modification réutilise la boucle de rendu et l'horloge de simulation.
Aucun RAF, intervalle, timeout ni gestionnaire d'entrée ajouté à la coque.
