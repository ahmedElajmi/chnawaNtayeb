---
domaine: références permanentes
niveau: index de référence (K-7)
nature: LISEZMOI — emplacements actuels des références permanentes (aucune fusion)
statut: à jour Étape C — fichiers déplacés ici (vérifiés par hash)
autorité: livrable v2.3 § 7 (K-7) + § 5 (registre)
---

# K-7 — Références permanentes

Destination : `docs/solution/references/`. **Aucune fusion** des deux références entre elles.
Déplacement Étape C effectué et vérifié (hash SHA-256 identiques ; journal complet du bilan C5).

| Référence | Emplacement | Rôle |
|-----------|-------------|------|
| Analyse des identifiants techniques et fonctionnels des modèles | `analyse-identifiants-techniques-fonctionnels.md` (ce dossier) | annexe d'architecture du lot F1 — identifiants des modèles existants et impacts 6a ; se lit avec `../evolutions/fondations-techniques/bascule-fournisseur/` (K-2) |
| `scenarios-initiaux.json` | `scenarios-initiaux.json` (ce dossier) | scénarios initiaux du chef (données de référence du produit, 08/11) — relecture par le core avant tout usage |

Règle rappelée : JSON = export/restauration/échanges uniquement, jamais source de données de
l'application ; toute donnée externe est relue par une fonction de validation du core.
