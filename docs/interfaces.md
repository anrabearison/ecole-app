# Interfaces — écrans par fonctionnalité et par rôle

> Complète `docs/architecture.md` (patterns techniques) et `docs/domaine-metier.md` (règles).
> Convention : routes et composants nommés en anglais, libellés affichés en français.

## Vue d'ensemble des rôles et de leurs espaces

| Rôle | Espace | Route racine |
|---|---|---|
| `PLATFORM_SUPER_ADMIN` | Gestion des écoles (multi-tenant) | `/platform` |
| `SCHOOL_ADMIN` | Administration complète d'une école | `/admin` |
| `STAFF_ADMIN` | Administration limitée d'une école | `/admin` (accès restreint) |
| `TEACHER` | Ses classes, notes, emploi du temps | `/teacher` |
| `STUDENT` | Consultation de ses infos | `/student` |

`SCHOOL_ADMIN` et `STAFF_ADMIN` partagent le même espace `/admin`, différencié par actions visibles (voir section Utilisateurs).

---

## 1. Authentification

### Tous rôles
```
app/(auth)/
  login/page.tsx
  forgot-password/page.tsx
  reset-password/page.tsx
```

- Connexion par email/mot de passe.
- Redirection post-connexion selon le rôle :
  - `PLATFORM_SUPER_ADMIN` → `/platform`
  - `SCHOOL_ADMIN`, `STAFF_ADMIN` → `/admin`
  - `TEACHER` → `/teacher`
  - `STUDENT` → `/student`

---

## 2. Gestion des écoles (multi-tenant)

### `PLATFORM_SUPER_ADMIN` uniquement

```
app/(dashboard)/platform/
  page.tsx                    # liste de toutes les écoles avec statistiques globales
  schools/
    new/page.tsx              # créer une école + son premier SCHOOL_ADMIN
```

- Liste des écoles avec statistiques globales (nombre d'élèves, enseignants, classes).
- **Limitation volontaire :** le PLATFORM_SUPER_ADMIN ne peut pas naviguer dans le détail métier d'une école spécifique (pas d'accès aux classes/élèves/notes d'une école). Il voit uniquement des statistiques globales.
- Création d'une école inclut la création du premier compte `SCHOOL_ADMIN` avec mot de passe temporaire.
- Aucun lien vers le détail d'une école — l'interface se limite à la vue liste + création.

---

## 3. Gestion des utilisateurs

### `SCHOOL_ADMIN` / `STAFF_ADMIN`

```
app/(dashboard)/admin/
  users/
    page.tsx                        # liste globale, filtrable par rôle
    teachers/
      page.tsx                      # liste enseignants
      new/page.tsx
      [id]/page.tsx                  # fiche enseignant (voir détail ci-dessous)
    students/
      page.tsx                      # liste élèves
      new/page.tsx
      [id]/page.tsx                  # fiche élève
    staff/
      page.tsx                      # liste staff admin (SCHOOL_ADMIN uniquement)
      new/page.tsx
```

### Fiche enseignant — `[id]/page.tsx`, en onglets

```
[Informations] [Matières & classes] [Notes saisies] [Emploi du temps] [Activité]
```
- **Informations** : identité, coordonnées, statut du compte.
- **Matières & classes** : liste des `TeacherSubject` (matière + classe assignées), éditable par l'admin.
- **Notes saisies** : historique en lecture seule, à but d'audit.
- **Emploi du temps** : ses créneaux, en lecture seule depuis cette vue.
- **Activité** : dernière connexion, actions récentes (si audit log implémenté).

### Fiche élève — `[id]/page.tsx`, en onglets

```
[Informations] [Classe & scolarité] [Notes] [Emploi du temps]
```
- **Informations** : identité, coordonnées (ou contact représentant légal).
- **Classe & scolarité** : classe actuelle, historique des classes par année scolaire.
- **Notes** : toutes ses notes, groupées par matière (vue identique à celle de l'élève lui-même, en lecture seule pour l'admin).
- **Emploi du temps** : celui de sa classe.

### Différenciation `SCHOOL_ADMIN` vs `STAFF_ADMIN` sur ces écrans

- `SCHOOL_ADMIN` : toutes les actions (créer, modifier, désactiver, supprimer un compte, changer un rôle).
- `STAFF_ADMIN` : peut créer/modifier les informations administratives (coordonnées, classe assignée, matières d'un enseignant) mais **ne peut pas** supprimer un compte ni changer un rôle. Ces actions sont masquées côté UI et bloquées côté `can()`.

---

## 4. Structure scolaire (cycles, niveaux, séries, classes)

### `SCHOOL_ADMIN` / `STAFF_ADMIN`

```
app/(dashboard)/admin/
  academics/
    grades/page.tsx          # gestion des niveaux (Grade) par cycle
    tracks/page.tsx          # gestion des séries (Track), à partir de Première
    classrooms/
      page.tsx                # vue arborescente des classes
      new/page.tsx             # création (formulaire adaptatif, voir plus bas)
      [id]/page.tsx             # fiche classe : liste des élèves, emploi du temps de la classe
    subjects/page.tsx        # gestion des matières
```

### Vue arborescente des classes (`classrooms/page.tsx`)

```
▾ Lycée
  ▾ Première
    ▾ Série C
      • Première C1 (32 élèves)
      • Première C2 (28 élèves)
  ▸ Seconde
▾ Collège
  ▾ 6ème
    • 6ème A (30 élèves)
    • 6ème B (29 élèves)
```

### Formulaire de création de classe — adaptatif

```
Cycle : [Lycée ▾]
Niveau : [Première ▾]
   → si le niveau a des séries, afficher :
Série : [C ▾]
Classe parallèle : [1]
Année scolaire : [2025-2026]
```

Le champ Série n'apparaît que si le niveau sélectionné en possède (logique déjà détaillée dans `docs/domaine-metier.md`).

### Fiche classe (`[id]/page.tsx`)

```
[Élèves] [Emploi du temps] [Notes de la classe]
```
- **Élèves** : liste des élèves inscrits, actions d'ajout/retrait.
- **Emploi du temps** : grille semaine de la classe (`<ScheduleView>`, voir section 6).
- **Notes de la classe** : vue globale des notes par matière, filtrable — utile pour un admin qui prépare un conseil de classe.

---

## 5. Notes

### `TEACHER`

```
app/(dashboard)/teacher/
  my-classrooms/page.tsx     # ses classes + matières assignées (TeacherSubject)
  grades/
    page.tsx                  # liste des notes qu'il a saisies, filtrable par classe/matière/type
    new/page.tsx                # saisie en masse
```

**Écran "Mes matières et classes"** :
```
▸ Mathématiques
  • 6ème A
  • 5ème B
▸ Physique-Chimie
  • 6ème A
```

**Saisie de notes en masse** (`grades/new/page.tsx`) :
```
Classe : [6ème A ▾]   Matière : [Mathématiques ▾]   Type : [Journalière ▾]   Date : [12/07/2026]

| Élève          | Note  |
|-----------------|-------|
| Rakoto Jean     | [14]  |
| Rasoa Marie     | [16]  |

[Enregistrer toutes les notes]
```
- Les sélecteurs Classe/Matière n'affichent que les assignations réelles de l'enseignant (`TeacherSubject`).
- Un seul Server Action reçoit le tableau complet plutôt qu'un appel par élève.

### `STUDENT`

```
app/(dashboard)/student/
  my-grades/page.tsx         # ses notes, groupées par matière
```

```
▾ Mathématiques
  • 15/06 — Examen — 14/20
  • 08/06 — Journalière — 16/20
▾ Français
  • 10/06 — Journalière — 12/20
```

### `SCHOOL_ADMIN` / `STAFF_ADMIN`

```
app/(dashboard)/admin/
  grades/page.tsx            # vue globale, filtrable par classe/matière/enseignant/période
```

---

## 6. Emploi du temps

### Composant partagé — `<ScheduleView>`

Un seul composant neutre affiche une grille semaine, réutilisé par tous les rôles avec des données déjà filtrées par la Server Action appelante :

```tsx
// components/ScheduleView.tsx
<ScheduleView slots={slots} />
```

```
        Lundi        Mardi         Mercredi
08h-10h  Maths 6A     Français 5B   —
10h-12h  —            Maths 6A      SVT 6B
```

### `TEACHER`
```
app/(dashboard)/teacher/schedule/page.tsx
```
- `<ScheduleView slots={getTeacherSchedule()} />` — uniquement ses propres créneaux.

### `STUDENT`
```
app/(dashboard)/student/schedule/page.tsx
```
- `<ScheduleView slots={getStudentSchedule()} />` — les créneaux de sa classe, lecture seule.

### `SCHOOL_ADMIN` / `STAFF_ADMIN`
```
app/(dashboard)/admin/schedule/
  page.tsx                    # vue globale, filtrable par classe ou enseignant
  new/page.tsx                 # création d'un créneau
```
- Création avec alerte visuelle en cas de conflit (même enseignant ou même salle déjà occupé sur ce créneau) — alerte informative, pas nécessairement bloquante.

---

## 7. Navigation par rôle — résumé

```ts
// lib/navigation.ts
const navItems = [
  { label: "Écoles", href: "/platform/schools", roles: ["PLATFORM_SUPER_ADMIN"] },

  { label: "Utilisateurs", href: "/admin/users", roles: ["SCHOOL_ADMIN", "STAFF_ADMIN"] },
  { label: "Structure scolaire", href: "/admin/academics/classrooms", roles: ["SCHOOL_ADMIN", "STAFF_ADMIN"] },
  { label: "Notes", href: "/admin/grades", roles: ["SCHOOL_ADMIN", "STAFF_ADMIN"] },
  { label: "Emploi du temps", href: "/admin/schedule", roles: ["SCHOOL_ADMIN", "STAFF_ADMIN"] },

  { label: "Mes classes", href: "/teacher/my-classrooms", roles: ["TEACHER"] },
  { label: "Notes", href: "/teacher/grades", roles: ["TEACHER"] },
  { label: "Emploi du temps", href: "/teacher/schedule", roles: ["TEACHER"] },

  { label: "Mes notes", href: "/student/my-grades", roles: ["STUDENT"] },
  { label: "Emploi du temps", href: "/student/schedule", roles: ["STUDENT"] },
]
```

---

## 8. Principes transverses à respecter sur tous les écrans

- Un layout par groupe de routes (`platform/`, `admin/`, `teacher/`, `student/`) vérifie le rôle une seule fois, pas chaque page individuellement.
- Les composants de présentation (tableaux, grilles) restent neutres : ils reçoivent des données déjà filtrées et des props de permission (`canEdit`, `canDelete`), sans connaître eux-mêmes le rôle.
- Toute action affichée côté UI (bouton, lien) reste doublée d'une vérification `can()` côté serveur — le masquage UI n'est jamais la seule protection.
- Les libellés, messages et contenus affichés sont en français ; le code (routes, composants, props) reste en anglais.

---

## Points non traités pour l'instant

- Interfaces liées au cycle Université.
- Interfaces de calcul de moyennes / génération de bulletins.
