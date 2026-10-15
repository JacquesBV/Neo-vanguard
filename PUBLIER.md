# Publier NEO VANGUARD sur GitHub Pages

Il n'y a **pas encore d'URL GitHub** : le jeu n'est pas encore publié. Ce dossier
`publier/` contient tout ce qu'il faut, à plat, prêt à monter sur un dépôt.

| Fichier | Rôle |
|---|---|
| `index.html` | **le jeu** (fichier unique, 848 Ko, tout est inliné : moteur PixiJS compris) |
| `README.md` | la documentation (concept, codes triches, tutoriel tactile…) |
| `neo-vanguard-codes-triches.pdf` | la fiche imprimable des 8 codes |
| `bandeau-readme.png` | le bandeau de tête du README (6 secteurs) |
| `banniere-neo-vanguard.png` | l'aperçu social du dépôt |
| `pack-nouveautes.png` | écran titre, récit et **les six boîtes de jeu** |
| `nouveaux-secteurs.png` | les secteurs Neo Geo et CD-ROM en jeu |
| `pack-graphique-4-eres.png` | aperçu des premières générations |
| `secteur4-nouveau.png` | aperçu de l'ancien secteur 4 (désormais secteur 6) |
| `.nojekyll` | dit à GitHub Pages de servir les fichiers tels quels (ignore Jekyll) |

Une fois publié, l'adresse sera :

```
https://jacquesbv.github.io/Neo-vanguard/
```

---

## Méthode A — sans ligne de commande (le plus simple)

1. Aller sur <https://github.com/new>
2. **Repository name** : `neo-vanguard` — visibilité **Public** — ne rien cocher
   (surtout pas « Add a README file », on en a un).
3. Cliquer **Create repository**.
4. Sur la page du dépôt vide : *uploading an existing file*.
5. Glisser **le contenu** de ce dossier (pas le dossier lui-même) :
   `index.html`, `README.md`, le PDF, les deux PNG, `.nojekyll`.
   ⚠️ `.nojekyll` et `index.html` **doivent être à la racine** du dépôt.
6. **Commit changes**.
7. Onglet **Settings → Pages** : *Source* = **Deploy from a branch**,
   *Branch* = **main**, *Folder* = **/ (root)** → **Save**.
8. Attendre ~1 minute, rafraîchir : l'adresse s'affiche en haut de la page Pages.

```
https://<TON-COMPTE>.github.io/neo-vanguard/
```

## Méthode B — en ligne de commande

Depuis ce dossier (`publier/`) :

```bash
git init -b main
git add -A
git commit -m "NEO VANGUARD — shmup 6 générations, fichier unique"
git remote add origin https://github.com/<TON-COMPTE>/neo-vanguard.git
git push -u origin main
```

Puis Settings → Pages → *Deploy from a branch* → `main` / `/ (root)` → Save.

## Méthode C — GitHub Desktop

*File → Add local repository…* → choisir ce dossier → **Publish repository**.
Décocher « Keep this code private » → **Publish**.
Puis activer Pages comme en méthode A (étape 7).

---

## Vérifications après publication

- La page doit charger **sans aucune requête externe** (tout est inliné) : elle
  fonctionne même hors ligne et derrière un pare-feu d'entreprise.
- Sur téléphone, ouvrir l'adresse, glisser le doigt pour piloter, **deux doigts**
  pour la bombe.
- Les codes triches se saisissent depuis **MENU CHEAT** (titre ou pause) :
  `kabrak77` d'abord.

## Si je veux un autre nom d'adresse

- Dépôt `neo-vanguard` → `https://<compte>.github.io/neo-vanguard/`
- Dépôt `<compte>.github.io` → `https://<compte>.github.io/` (le jeu est servi à la racine)
- Nom de domaine personnel : *Settings → Pages → Custom domain*, puis un
  enregistrement `CNAME` chez le registrar pointant vers `<compte>.github.io`.
