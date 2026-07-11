# Domaine métier

> Contexte : système scolaire malgache (Madagascar). Cycles couverts pour l'instant : Primaire, Collège, Lycée.
> L'Université sera traitée plus tard — ne pas anticiper sa structure dans le schéma actuel.

## Multi-tenant

- Plusieurs écoles (`School`) utilisent la même application.
- Chaque école a ses propres administrateurs, staff, enseignants et élèves.
- Un utilisateur appartient à **une seule** école, jamais plusieurs.

## Rôles (5)

| Rôle | Portée | Peut faire |
|---|---|---|
| `PLATFORM_SUPER_ADMIN` | Toutes les écoles (`schoolId` null) | Gestion des écoles (création, statistiques globales). **Limitation volontaire :** ne peut pas naviguer dans le détail métier d'une école (pas d'accès aux classes/élèves/notes d'une école spécifique). |
| `SCHOOL_ADMIN` | Une école | Tout, dans son école uniquement |
| `STAFF_ADMIN` | Une école | Tâches administratives uniquement |
| `TEACHER` | Une école | Actions le concernant uniquement (ses classes, ses notes saisies, son emploi du temps) |
| `STUDENT` | Une école | Consultation seule (ses notes, son emploi du temps) |

## Structure scolaire

```
Cycle (PRIMARY / MIDDLE_SCHOOL / HIGH_SCHOOL)
  └─ SchoolGrade (ex: 6ème, Seconde, Première)
       └─ Track / série — uniquement à partir de Première (ex: A, C, D, OSE)
       └─ Classroom — classe parallèle physique (A, B, 1, 2...), propre à une année scolaire
```

> Nommé `SchoolGrade` (et non `Grade`) dans le schéma pour éviter la confusion avec `Grade` = note. Voir `docs/conventions.md`.

### Règles précises

- Primaire et Collège : chaque niveau (`SchoolGrade`) peut avoir plusieurs classes parallèles (`Classroom`), pas de série.
- Lycée — Seconde : classes parallèles, pas de série.
- Lycée — à partir de Première : chaque niveau a des séries (Littéraire / Scientifique : A, C, D, OSE), et chaque série peut elle-même avoir des classes parallèles.
- Une `Classroom` est toujours rattachée à une année scolaire (`schoolYear`) — les élèves d'une classe changent d'une année sur l'autre, ne pas mélanger les années.
- Le nom d'affichage complet d'une classe (ex. "Première C 1") est **généré**, jamais stocké en dur.
- L'affectation d'un élève à une classe est historisée par année scolaire via `Enrollment` (une ligne par élève × année scolaire) — `Student.classroomId` ne reflète que la classe courante ; l'historique complet passe toujours par `Enrollment`.

## Notes (Grades)

- Deux types : `EXAM` (examen) et `DAILY` (note journalière).
- Un enseignant ne voit et ne modifie **que les notes qu'il a lui-même saisies** — pas celles saisies par un collègue, même dans une classe qu'il partage.
- Une note est toujours rattachée à : élève, matière, classe, enseignant (celui qui l'a saisie), école.
- Avant toute création de note par un enseignant, vérifier qu'il est bien assigné à cette matière **et** cette classe (voir `TeacherSubject` ci-dessous) — sinon refuser.

## Enseignants et matières

- Un enseignant peut enseigner une ou plusieurs matières.
- Une même matière peut être enseignée par lui dans certaines classes seulement, pas forcément toutes (ex: Maths en 6ème A mais pas en 6ème B).
- Cette assignation est modélisée par une table de liaison (`TeacherSubject` : enseignant + matière + classe).

## Emploi du temps (Schedule)

- Un créneau (`ScheduleSlot`) relie : jour, heure de début/fin, classe, matière, enseignant, salle (optionnelle).
- Un enseignant ne voit que **son propre** emploi du temps (créneaux où il est l'enseignant assigné).
- Un élève voit l'emploi du temps de **sa classe** (tous les créneaux de sa `Classroom`).

### Détection de conflits

Lors de la création ou modification d'un créneau, le système détecte les conflits suivants et retourne des avertissements non bloquants :

- **Conflit enseignant** : un enseignant ne peut pas avoir deux créneaux qui se chevauchent au même moment.
- **Conflit salle** : une salle ne peut pas être occupée par deux créneaux qui se chevauchent au même moment (si `roomId` est spécifié).
- **Conflit classe** : une classe ne peut pas avoir deux créneaux qui se chevauchent au même moment, quelle que soit la matière, l'enseignant ou la salle.

Plusieurs conflits peuvent être détectés simultanément (ex: conflit classe + salle) et tous sont affichés à l'utilisateur.

## Règles de permission par ressource

> `PLATFORM_SUPER_ADMIN` : accès `view`/`create`/`update`/`delete` total sur **toutes** les ressources ci-dessous, sur **toutes** les écoles, sans exception. Cette règle prime sur toutes les autres listées par ressource — elle n'est pas répétée à chaque ligne ci-dessous.

### Notes (`grade`)
- `TEACHER` → `view` : uniquement si `grade.teacherId === session.user.teacherId`
- `TEACHER` → `create`/`update` : uniquement si assigné via `TeacherSubject` (matière + classe)
- `STUDENT` → `view` : uniquement ses propres notes
- `SCHOOL_ADMIN` / `STAFF_ADMIN` → `view` : toutes les notes de leur école

### Emploi du temps (`schedule`)
- `TEACHER` → `view` : uniquement ses propres créneaux
- `STUDENT` → `view` : uniquement les créneaux de sa classe

### Utilisateurs (`user`)
- `SCHOOL_ADMIN` → tout, dans son école (y compris désactiver/changer un rôle)
- `STAFF_ADMIN` → peut voir et modifier les infos administratives, ne peut pas supprimer un compte ni changer un rôle

### Matières (`subject`)
- `TEACHER` → `view` : uniquement les matières auxquelles il est assigné (via `TeacherSubject`)
- `SCHOOL_ADMIN` / `STAFF_ADMIN` → `view`/`create`/`update`/`delete` : toutes les matières de leur école

### Classes (`classroom`)
- `TEACHER` → `view` : uniquement les classes auxquelles il est assigné (via `TeacherSubject`)
- `SCHOOL_ADMIN` / `STAFF_ADMIN` → `view`/`create`/`update`/`delete` : toutes les classes de leur école
- `STUDENT` → `view` : uniquement via son emploi du temps (créneaux de sa classe)

## Points volontairement non traités pour l'instant

- Cycle Université (structure différente : semestres, UE, filières) — à concevoir plus tard, sans réutiliser tel quel le modèle `Grade`/`Track` actuel.
- Calcul des moyennes / bulletins — à définir dans une prochaine itération.
