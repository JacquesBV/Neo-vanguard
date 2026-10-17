# UPDATE — 17 octobre 2026

Base : **le dernier `index.html` fourni** par l'utilisateur. Ce pack reprend aussi les corrections de sauvegarde livrées précédemment.

## Nouvelle mise à jour audio

- Ajout de **L’Éveil**, thème instrumental original doux et mythique, **intégré directement dans `index.html`**. Une copie séparée reste disponible dans `music/title.mp3`. L’aperçu isolé peut ainsi lire la musique sans accès aux fichiers du dossier.
- L'écran « Appuyer pour entrer » et le menu principal utilisent **le même lecteur et la même piste** : la musique ne redémarre pas, ne se dédouble pas et reste audible pendant le passage au menu.
- Suppression du générateur d'ambiance du menu titre (vent, réacteurs, radio, sonar, survols).
- Sur le menu principal et l'écran d'entrée, suppression des effets de démonstration et des bips de navigation : **musique seule**.
- Sur mobile, si l'autoplay est refusé, le premier toucher lance la musique pendant que l'écran d'entrée reste affiché brièvement. Avant tout geste, aucun site web ne peut garantir une lecture sonore automatique.

## Corrections précédentes conservées

- Normalisation des améliorations lors du chargement des sauvegardes incomplètes ; utilisation du garde-fou `upgs()` déjà présent dans le fichier fourni.
- Rechargement des bonus du marchand `nv_perk` **après** la sauvegarde principale pour ne plus les perdre.
- Initialisation des bonus avant d'ouvrir le dialogue du marchand.
- Crédits, vaisseaux et progression existants non réinitialisés volontairement.

## Déploiement

Envoyez le **contenu** du dossier à la racine du dépôt GitHub Pages, en remplaçant `index.html`. La musique d’accueil est déjà intégrée dans le HTML ; `music/title.mp3` est une copie séparée. Ne supprimez pas d'éventuels autres MP3 déjà présents sur GitHub. Voir `README.md`.

Les autres pistes MP3 du jeu ne sont pas incluses dans ce pack ; le moteur audio synthétique reste disponible pour ces scènes.
