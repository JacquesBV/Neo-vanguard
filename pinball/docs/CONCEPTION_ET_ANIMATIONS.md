# Neo-Vanguard Pinball

Une table bonus fixe, vue de dessus, en acier, chrome et émail rouge. Terre et vaisseau au centre, Vorax rouge au sommet. La bille doit rester plus lisible que le décor. Le pack fournit les ressources ; l'animation et la physique seront réalisées lors de l'intégration.

## Boucle de partie

Trois billes, sans limite de temps globale. Maintenir le lance-bille règle la puissance ; relâcher lance la bille. Protection de 8 secondes après un lancement initial : une perte renvoie la même bille et ne consomme pas une vie. La protection ne se réarme pas sur chaque renvoi. En fin de partie, comptabiliser le bonus, afficher le record et proposer Rejouer ou Menu.

| Événement | Points proposés | Réaction |
|---|---:|---|
| Petit rebond | 100 | Flash discret et claquement |
| Bumper central | 500 | Compression, flash et onde |
| Cible abattue | 1 000 | Cible descend, voyant allumé |
| Banque de 3 cibles | 5 000 | Banque se réarme après 1 seconde |
| Rampe validée | 2 500 | Poursuite lumineuse dans le sens de la bille |
| Secteur terminé | 10 000 | Affichage du secteur suivant |
| Réacteur Vorax touché pendant le défi | 5 000 | Réacteur rouge pulsant |
| Vorax vaincu | 100 000 | Célébration et multibille |
| Jackpot de rampe en multibille | 25 000 | Flashes limités et message |

Les bonus d'événement sont multipliés par x1, x2, x3 ou x5. Compléter deux banques de cibles augmente d'un palier le multiplicateur. Le multiplicateur revient à x1 à la bille suivante. Les cibles et missions continuent pendant le multibille. La multibille ne se cumule pas avec une autre multibille.

## Missions des 24 secteurs

Le nom et la console de chaque secteur sont récupérés dans les données existantes de Neo-Vanguard, sans inventer une nouvelle correspondance. L'afficheur peut reprendre leurs couleurs et leur style rétro. La table physique reste identique.

Les objectifs tournent sur quatre types : secteur 1 = 10 bumpers ; secteur 2 = 2 passages de rampe gauche ; secteur 3 = 2 passages de rampe droite ; secteur 4 = abattre les deux banques. Répéter ce cycle jusqu'au secteur 24, avec les mêmes seuils pour conserver un bonus accessible. Un seul objectif est actif et son avancement est affiché en permanence. Le secteur se valide automatiquement ; les progrès ne sont pas perdus à chaque bille. La progression des missions repart à 1 à chaque nouvelle partie.

Au secteur 24 terminé, allumer le réacteur et ouvrir un défi Vorax : 5 impacts du réacteur en 45 secondes. À l'expiration, les banques permettent de réarmer une tentative ; ne pas remettre les 24 secteurs à zéro. Une victoire donne 100 000 points et lance 3 billes au total par la voie de lancement, espacées de 800 ms. Le jackpot est actif tant qu'au moins 2 billes restent. Quand une seule reste, retour au jeu normal ; ne consommer une bille de réserve que lorsque toutes les billes actives sont perdues. Éviter de relancer le défi en boucle instantanée : une nouvelle série des deux banques est nécessaire.

## Animations

| Élément | Animation à réaliser | Durée conseillée |
|---|---|---|
| Batteurs | Rotation depuis le pivot extérieur, maintien en haut | montée 45–65 ms, descente 80 ms |
| Bumper | état neutre → lumineux → impact → neutre, petite compression | 160 ms |
| Cible | déplacement vertical simulé et passage à la case abaissée | 100 ms |
| LEDs | changement d'opacité et poursuite de quelques inserts | 6–10 lumières/seconde |
| Bille | déplacement physique, reflet cyan/magenta selon zone, ombre séparée | continu |
| Impact | 4 images d'onde ou étincelles, fondu final | 120–200 ms |
| Réacteur | pulsation douce, accélération lors du défi | cycle 0,5–1,4 s |
| Afficheur | texte réel sur trame à points, balayage léger | 4–6 caractères/seconde |
| Déblocage | apparition du cadeau puis bouton Jouer | 700 ms |

Faire tourner les batteurs à partir d'une seule image chacun ; les trois états du bumper sont des ressources séparées à aligner. Les planches d'effets comportent des marges irrégulières : chaque image est à recentrer et les éventuels débordements doivent être masqués lors de l'affichage. Les effets ne définissent jamais les collisions.

## Couches et rampes

1. Plateau statique.
2. Éclairage des inserts, sans illuminer toute la surface.
3. Cibles et mécanismes bas.
4. Ombres des billes puis billes au sol.
5. Rails et bords supérieurs des rampes, via masques de la texture du plateau.
6. Billes présentes sur les rampes, selon leur état de trajectoire.
7. Effets ponctuels puis interface et textes.

Le plateau contient déjà les rails et les slingshots fixes : ne pas superposer une deuxième paire de slingshots sur les mêmes pièces. Les sprites de slingshots servent de variantes ou pour une animation locale avec masque. Les deux petits modules ronds dans les boucles supérieures peuvent rester décoratifs ; les trois bumpers jouables sont ceux ajoutés au centre. Les rampes doivent avoir une entrée, un trajet et une sortie déterminés ; aucune bille ne disparaît arbitrairement sous l'image d'une rampe. Les masques et colliders sont à construire pendant l'intégration, ils ne sont pas fournis comme géométrie validée.

## Affichage et ergonomie

Coordonnées de travail : 1024 × 1536 pour le plateau. Conserver le ratio sans étirer. Mobile portrait : table entière, interface compacte, grandes zones tactiles. PC paysage : table centrée, score et aide dans les marges. Le menu de déblocage est une illustration paysage : la contenir entièrement ou disposer les commandes à l'extérieur sur mobile, sans couper les informations.

La caméra reste immobile ; les changements visuels concernent les lumières et l'afficheur. Viser une animation à 60 images/seconde lorsque l'appareil le permet. La physique utilise un pas fixe indépendant du rendu, avec collisions continues ou sous-pas pour les billes rapides. Les paramètres doivent être réglés en jouant, pas simplement copiés d'une fiche.

## Audio fourni

18 WAV stéréo 44,1 kHz, PCM 16 bits : 17 sons d'interaction et `musique_neon_orbit_120bpm_boucle_32s.wav`, composition synthétique originale. Pas de voix enregistrée. Limiter la polyphonie et varier légèrement certains impacts pour éviter la répétition. La boucle dure exactement 32 secondes ; vérifier la transition dans le moteur audio choisi. Aucun fichier sonore de Pinball FX n'est utilisé.
