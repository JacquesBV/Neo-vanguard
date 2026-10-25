# FanBoy NV-01

`nv01-shell.svg` est la coque vectorielle réutilisable, 600 × 840, avec une
ouverture transparente de 480 × 360 en (60, 90). Les boutons et LED sont des
calques Canvas dans `js/51-nv-fanboy-reference.js`, pilotés par la boucle de
rendu existante. Aucun intervalle, écouteur d'entrée ou RAF supplémentaire.

L'illustration centrale utilise directement `assets/ships-native/r0-falcon.png`,
la coque Vanguard MK-I chargée par le rendu natif du jeu (module 34).

Les commandes observent les directions résolues après clavier, manette et
pilotage au doigt, ainsi que le tir effectif (y compris automatique). La bombe
dispose d'une pression de 140 ms sur l'horloge de simulation pour les commandes
ponctuelles (bouton tactile, double tap). Les boutons se relèvent hors jeu.

Le cadre passe progressivement du vert à l'orange entre 35 et 50 % des vagues,
puis au rouge entre 75 et 90 %. L'arrivée du boss utilise `nvAlertSignal`,
exactement comme la bannière WARNING : même `G.bossWarnT`, même enveloppe,
même phase de clignotement. Le combat garde le rouge fixe. La LED cyan
d'alimentation reste fixe.

L'écran conserve les coordonnées moteur 640 × 480, les collisions, la palette et le
HUD du jeu. Seule sa taille de présentation change pour loger la coque entière.
Le mobile conserve le pilotage au doigt et sa barre tactile existante.
