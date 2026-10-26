# artpack_s01_v2 — adaptation native du pack « Secteur 1 / FanBoy V2 »

Source : `NEO_VANGUARD_S01_FANBOY_V2` (Drive, tailles corrigées le 26/10/2026).
Contrat : `native/sector1/ARTPACK_CONTRACT.md` — la simulation (`mission.gd`)
reste la seule source des attaques, dégâts, trajectoires et timings.

## Correspondances
| Élément V2 | Adaptation native |
|---|---|
| 3 bandes 160×480 (floor/structures/foreground) | 15 modules 160×160 × 3 couches (`layers/00..11_*`) |
| `silo-composite.png` 160×480 | modules 12 (approche silo) / 13 (silo) / 14 (après-combat) |
| `route.json` V2 (couches longues) | `route.json` natif : 17 slots, arène [12,13], aftermath 14 |
| 28 séries d'ennemis natives (manifest cell/pivot/fps) | dessin 1:1 au pivot, frames au fps du manifest ; repli = baker cuit ; la forme mineure du Gardien reste cuite (identité) |
| Gardien du Silo 7 pièces × 6 états (96×128) | `godot/guardian.gd` : API provisoire conservée (play_action / set_damage / set_target / weapon_fired / socket) ; colonnes d'états mappées : open→charge, fire→attack ; sockets eye/muzzle_l/muzzle_r/core |
| 8 séries FX 32×32 ×8 frames | `fx_*_frames.tres` : beam←enemy_orb, muzzle←muzzle_flash, flame←debris, telegraph←shield_hit, autres←homonymes |
| ui/dialogues | non fournis par la V2 → cadres vides repris du pack provisoire |
| palette | vérifiée exacte : 4 encres + alpha binaire sur les 95 PNG (audit PIL + test Godot ; les PNG copiés sont pixel-identiques aux originaux V2) |

## Décisions et écarts déclarés
- Joueurs : ère 0 native conservée (les 7 vaisseaux roulis vivent dans le
  projet Godot V13, pas dans la branche native).
- `set_damage` : la V2 n'a pas d'art de fissures ; le niveau (0/1/2) est
  exposé pour les tests et l'expression visuelle reste l'état `damage`
  (piloté par `hurt_t`) puis `defeat`. Le forçage de dégâts reste interdit.
- FX natives non consommés hors Gardien : les projectiles/tirs du champ
  restent dessinés par la voie V13 (16 angles + pulsations) — identiques au
  jeu original, conformément au contrat (aucun effet fondu aux corps).
- Taille du boss : contenu du master 70×89 px ≈ boss cuit 70×90 (continuité).
- Ancien pack `artpack_s01` conservé intact jusqu'à validation complète.
