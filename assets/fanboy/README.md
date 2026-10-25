# FanBoy NV-01 — proposition détaillée v2

Version locale en attente de validation visuelle. La référence est le triptyque
fourni par l'utilisateur, et non la première coque vectorielle publiée.

`nv01-shell-render-v2.png` : texture RGBA 1024 × 1536, avec transparence extérieure
et ouverture d'écran. Le fichier provient de l'outil intégré de génération
d'images, guidé par le triptyque : coque identique, vue frontale, matériaux
glossy maîtrisés, reliefs et inscriptions conservés, LED variables éteintes,
boutons au repos, ciel étoilé sans vaisseau pour recevoir l'illustration officielle.
Le SVG de première version est conservé comme historique et n'est plus chargé.

Le jeu occupe une zone 560 × 420 en (244, 228). Les coordonnées moteur restent
640 × 480 ; aucune déformation du monde ni modification de collisions/palette.
La texture est chargée une fois. Les boutons enfoncés réutilisent ses propres
textures, avec déplacement, réduction et lumière interpolés sur `G.t`.
L'illustration imprimée utilise directement `assets/media/ships-shop/falcon.webp`,
le Vanguard officiel du hangar du jeu, sans nouveau vaisseau généré.

Le cadre et les témoins supérieur/latéraux suivent la progression verte, orange,
rouge. La phase bossWarn utilise `nvAlertSignal(G.bossWarnT, G.bossWarnTotal)`
comme la bannière. La LED POWER rouge reste fixe dans la texture.

Les entrées clavier, manette et tactiles viennent du moteur existant.
Aucun nouvel intervalle, écouteur d'entrée, timeout ou RAF. Sur PC, les
panneaux de télémétrie et la radio se placent à l'extérieur de la coque entière.
