# Structure modulaire de Neo-vanguard

Refactorisation sans changement de comportement : le `index.html` monolithe de 2,82 Mo a été découpé en modules. 
Chaque module contient exactement le code d'un bloc `<script>` d'origine (extraction byte-exacte vérifiée), 
dans le même ordre d'exécution. Les 24 blocs `<style>` sont fusionnés dans `css/neo-vanguard.css` dans l'ordre du document.

## Arborescence

```
index.html          32,8 Ko — squelette HTML, JSON nvMusicCatalog, références aux modules
css/
  neo-vanguard.css  feuille unique (24 blocs CSS d'origine, commentaires de provenance)
js/
  01..50-*.js       un fichier par bloc script, numérotés dans l'ordre d'exécution
pinball/            inchangé (moteur flipper, déjà externe)
level24-v2/         inchangé
assets/, music/     inchangés (médias)
```

## Table de correspondance des 50 modules JS

| Module | Ligne d'origine | id d'origine | Octets |
|---|---|---|---|
| `01-nv-warnings.js` | 861 | nv-warnings | 8,960 |
| `02-moteur-jeu.js` | 937 | — | 1,810,152 |
| `03-cloudflare-1.js` | 22454 | — | 211,926 |
| `04-cloudflare-2.js` | 25035 | — | 921 |
| `05-cloudflare-3.js` | 25035 | — | 921 |
| `06-nv-cinematic-game-pass.js` | 25074 | nv-cinematic-game-pass | 5,463 |
| `07-nv-ultimate-render-pass.js` | 25174 | nv-ultimate-render-pass | 4,331 |
| `08-nv-generation16-boss-art.js` | 25248 | nv-generation16-boss-art | 1,280 |
| `09-nv-performance-rewards.js` | 25283 | nv-performance-rewards | 6,272 |
| `10-nv-painted-generation-backdrops.js` | 25368 | nv-painted-generation-backdrops | 7,336 |
| `11-profils-machines.js` | 25490 | — | 1,236 |
| `12-lumiere-auto.js` | 25528 | — | 667 |
| `13-tier-lancement.js` | 25553 | — | 1,369 |
| `14-guardian-silo-art.js` | 25580 | guardian-silo-art | 12,520 |
| `15-nv-level1-hazard-cleanup.js` | 25746 | nv-level1-hazard-cleanup | 800 |
| `16-nv-silo-guardian-deluxe.js` | 25770 | nv-silo-guardian-deluxe | 9,558 |
| `17-nv-silo-guardian-v3.js` | 25897 | nv-silo-guardian-v3 | 12,458 |
| `18-nv-bastion4-deluxe.js` | 26133 | nv-bastion4-deluxe | 9,978 |
| `19-nv-sentinel2-transformation.js` | 26268 | nv-sentinel2-transformation | 10,858 |
| `20-nv-vorax-eyebeams-and-shattered-alert.js` | 26424 | nv-vorax-eyebeams-and-shattered-alert | 9,663 |
| `21-nv-alert-redesign.js` | 26573 | nv-alert-redesign | 6,526 |
| `22-nv-sector-phone-profiles.js` | 26655 | nv-sector-phone-profiles | 7,475 |
| `23-nv-no-horizontal-drift.js` | 26745 | nv-no-horizontal-drift | 1,085 |
| `24-nv-fanboy-authentic.js` | 26762 | nv-fanboy-authentic | 23,957 |
| `25-nv-options-reorg.js` | 27113 | nv-options-reorg | 11,023 |
| `26-nv-title-reorg.js` | 27226 | nv-title-reorg | 5,612 |
| `27-nv-shop-reorg.js` | 27333 | nv-shop-reorg | 7,646 |
| `28-nv-insert-coin-and-bonus.js` | 27509 | nv-insert-coin-and-bonus | 28,340 |
| `29-nv24-final-rework.js` | 27867 | nv24-final-rework | 88,021 |
| `30-nv-music-shop-js.js` | 29028 | nv-music-shop-js | 14,206 |
| `31-nv-fm-relook-js.js` | 29316 | nv-fm-relook-js | 17,613 |
| `32-nv-lcd-calm.js` | 29529 | nv-lcd-calm | 4,162 |
| `33-nv-ship-sheets.js` | 29615 | nv-ship-sheets | 15,604 |
| `34-nv-ship-native.js` | 29850 | nv-ship-native | 29,853 |
| `35-nv-pause-btn-js.js` | 30104 | nv-pause-btn-js | 1,145 |
| `36-nv-title-mute.js` | 30189 | nv-title-mute | 346 |
| `37-nv-fm-labels-js.js` | 30213 | nv-fm-labels-js | 4,928 |
| `38-nv-fm-meuble-js.js` | 30320 | nv-fm-meuble-js | 4,627 |
| `39-nv-homing-sprite.js` | 30387 | nv-homing-sprite | 3,738 |
| `40-nv-voice-gender.js` | 30445 | nv-voice-gender | 3,110 |
| `41-nv-fm-deck-js.js` | 30581 | nv-fm-deck-js | 19,281 |
| `42-nv-help-js.js` | 30930 | nv-help-js | 28,125 |
| `43-nv-fluid-js.js` | 31233 | nv-fluid-js | 19,141 |
| `44-nv-progress-map.js` | 31455 | nv-progress-map | 8,347 |
| `45-nv-brief-art.js` | 31565 | nv-brief-art | 2,811 |
| `46-nv-boss-sprites.js` | 31615 | nv-boss-sprites | 50,918 |
| `47-nv-tickets.js` | 32132 | nv-tickets | 42,377 |
| `48-nv-big-sprites.js` | 32778 | nv-big-sprites | 4,941 |
| `49-nv-mix.js` | 32877 | nv-mix | 5,395 |
| `50-cloudflare-4.js` | 32995 | — | 921 |

## Garanties de non-régression (vérifiées par test A/B navigateur headless)

- Concaténation des 50 modules strictement identique aux blocs JS d'origine (comparaison octet par octet)
- Les 24 blocs CSS sont présents dans la feuille, dans l'ordre, sans altération
- `node --check` valide sur les 50 modules
- Aucune erreur JavaScript, DOM/canvas/globaux identiques, captures d'écran identiques (avertissement, titre, prologue)
- Le bloc JSON `nvMusicCatalog` et les scripts externes `pinball/` et `level24-v2/` sont restés en place

## Note : scripts Cloudflare

`js/03,04,05,50-cloudflare-*.js` sont d'anciens injecteurs Cloudflare (`/cdn-cgi/challenge-platform`) qui renvoient 404 sur GitHub Pages. 
Ils ont été conservés fidèlement ; leur suppression (sans effet sur le jeu) peut faire l'objet d'un commit séparé.

## Comment travailler maintenant

Chaque fonctionnalité correspond à un module nommé (ex. `44-nv24-final-rework.js`, `34-nv-fanboy-authentic.js`) : 
une IA peut éditer un seul petit fichier au lieu d'un monolithe de 33 000 lignes. Test local : ouvrir `index.html` via un serveur HTTP, puis `git add`/`commit`/`push`.

## Ajout : secteur 24 ANIME (branche modules-secteur24)

Fusion de la structure modulaire avec le pack S24_integration :
- `js/29-nv24-final-rework.js` contient désormais le contrôleur ANIME (crochets `NV24ANIME`, dialogue VORAX, deux jauges de mains, `?nv24play`).
- `index.html` : les deux balises de fin chargent `assets/level24-anime/vertical-loop.js` puis `level24-v2/level24-anime.js` (l'ancien `level24-v2.js` n'est plus référencé).
- Nouveaux dossiers `assets/level24-anime/` (52 WebP pc/mobile) et `assets/sector24/audio/` (26 OGG + 26 WAV), identiques bit-à-bit à la branche `secteur24-anime`.
- Test A/B navigateur contre la version monolithe S24 : états de jeu, textures, canvas et démarrage normal identiques, aucune erreur JavaScript.
