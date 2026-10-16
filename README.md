# NEO VANGUARD — Shmup évolutif

Shoot 'em up vertical dont le moteur graphique évolue au fil de la campagne :
24 secteurs répartis sur 6 générations de consoles (8 bits portable → HD vectoriel).
Un seul fichier `index.html` (moteur, interface, illustrations, textes en 5 langues)
plus un dossier `music/` de pistes libres.

## Jouer

- **En ligne** : ouvre simplement la page publiée (GitHub Pages, voir ci-dessous).
- **En local** : sers le dossier avec un petit serveur HTTP, par exemple
  `python3 -m http.server 8000` puis ouvre <http://localhost:8000/>.
  (Ouvrir `index.html` directement en `file://` fonctionne dans la plupart des
  navigateurs, mais certains bloquent alors la musique.)

Contrôles : flèches / ZQSD pour piloter, Espace pour tirer, B pour la bombe,
X / Tab pour changer d'arme, Échap pour la pause, F pour le plein écran.
Compatible tactile et à deux joueurs sur le même clavier ; mode co-op en ligne.

## Publier sur GitHub Pages

1. Crée un dépôt et pousse ce dossier à la racine :
   ```bash
   git init
   git add .
   git commit -m "NEO VANGUARD"
   git branch -M main
   git remote add origin https://github.com/<toi>/<depot>.git
   git push -u origin main
   ```
2. Dans *Settings → Pages*, choisis **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Le jeu est servi à `https://<toi>.github.io/<depot>/` au bout d'une minute.

## Contenu

| Chemin | Rôle |
|---|---|
| `index.html` | Le jeu complet (≈7,5 Mo : images encodées en base64) |
| `music/*.mp3` | Bande originale (12 pistes, toutes CC0) |
| `music/CREDITS.txt` | Attribution détaillée des pistes |
| `LICENSE` | Licence du code (MIT) |

## Crédits

- Musiques : CC0 / domaine public — détail dans `music/CREDITS.txt`
  (Juhani Junkala, iamoneabe, haeldb, Of Far Different Nature, OpenGameArt).
- Effets sonores : synthèse WebAudio en temps réel, aucun fichier externe.
- Illustrations (portraits, boîtes, vaisseaux, décors) : images générées pour ce projet.
- Aucune dépendance réseau au lancement ; le mode en ligne utilise WebRTC.
