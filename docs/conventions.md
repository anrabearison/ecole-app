# Conventions de code

> Destiné aux agents IA (Windsurf, Devin) : lire ce fichier avant toute tâche de développement,
> avec `docs/architecture.md`, `docs/domaine-metier.md` et `prisma/schema.prisma`.

## Langue

- **Tout le code est en anglais** : noms de variables, fonctions, modèles Prisma, champs de base de données, types, fichiers.
- Le français est réservé aux libellés visibles par l'utilisateur final (texte UI, messages d'erreur affichés) et aux commentaires métier si nécessaire.
- Exemples de correspondance :
  - "élève" → `student`
  - "enseignant" → `teacher`
  - "classe" → `classroom`
  - "note" → `grade`
  - "matière" → `subject`
  - "emploi du temps" → `schedule`
  - "école" → `school`
  - "niveau" → `grade` (scolaire) — attention à l'ambiguïté avec "note", utiliser `schoolGrade` ou `level` pour lever le conflit si besoin
  - "série" → `track`

## Structure de code

- Un Server Action par fichier, regroupé par domaine : `lib/actions/student.ts`, `lib/actions/grade.ts`.
- Un schéma Zod par domaine : `lib/validations/student.ts`.
- Un composant = un fichier, nommage `PascalCase`.
- Aucune logique métier dans les composants — tout dans `lib/`.

## Typage

- TypeScript strict activé, jamais de `any`.
- Les types partagés entre validation et Server Action viennent du même schéma Zod (`z.infer<typeof studentSchema>`).

## Server Actions — format de retour standard

```ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```

- Jamais de `throw` pour un cas métier attendu (erreur de validation, permission refusée) — toujours retourner `{ success: false, error }`.
- `throw` réservé aux erreurs techniques inattendues.

## Permissions

- Toute vérification passe par `lib/permissions.ts::can()` — jamais de `if (role === ...)` dispersé dans le code.
- Le rôle et le `schoolId` sont lus depuis `auth()` côté serveur, jamais reçus en paramètre d'une fonction appelée depuis le client.
- Toute Server Action de mutation appelle `can()` en première ligne, avant toute lecture/écriture en base.

## Gestion des mots de passe temporaires

Lors de la création d'un compte utilisateur (Student, Teacher, etc.) avec un mot de passe temporaire :

- **Jamais de `console.log`** du mot de passe en clair dans le code serveur.
- **Retourner le mot de passe une seule fois** dans l'ActionResult de création (ex: `{ success: true, data: { student, temporaryPassword } }`).
- **Afficher le mot de passe dans l'interface** via une modale ou un encart après création réussie, avec un avertissement clair qu'il ne sera plus affiché.
- **Ne jamais stocker** le mot de passe en clair — uniquement le hash bcrypt en base.
- **Appliquer ce pattern** à toute entité qui crée un compte utilisateur (Student, Teacher, etc.).

Exemple de structure de retour :
```ts
type StudentCreateResult = {
  student: StudentWithRelations
  temporaryPassword: string  // Retourné une seule fois pour affichage UI
}
```

## Multi-tenant

- Toute requête Prisma sur une entité scopée par école filtre explicitement sur `schoolId`.
- Utiliser `prismaForSchool(schoolId)` plutôt que `prisma` directement dans les Server Actions qui touchent une entité scopée.
- Ne jamais accepter un `schoolId` en paramètre venant du client — toujours depuis la session serveur.

## Data fetching

- Server Components pour l'affichage initial, Server Actions pour les mutations.
- Pas d'API Routes si une Server Action suffit.
- TanStack Query uniquement sur un écran ayant un besoin réel d'interactivité client (recherche live, filtres dynamiques) — ne pas l'ajouter par défaut.
- Pas de state manager global (Redux/Zustand).

## Tests

- Un fichier de test à côté du fichier testé : `lib/actions/student.ts` + `lib/actions/student.test.ts`.
- Priorité de test (dans l'ordre) :
  1. `lib/permissions.ts::can()` — un cas par rôle × action, critique pour la sécurité
  2. Server Actions de mutation (validation + cas d'erreur)
  3. Composants de formulaire complexes
  4. Parcours E2E critiques uniquement (connexion, création élève, saisie de notes) — pas de couverture E2E exhaustive
- **Mocking de Prisma** : Les tests unitaires (hors E2E) ne doivent pas se connecter à une vraie base de données.
  - Le client Prisma est globalement mocké dans `vitest.setup.ts` via `vitest-mock-extended`.
  - **Pattern obligatoire pour chaque fichier de test** (voir `lib/actions/classroom.test.ts`) :
    1. **Mock de session** : Définir une fonction `mockSession(role, schoolId)` qui utilise `vi.mocked(auth).mockResolvedValue(...)` pour simuler le contexte utilisateur.
    2. **Reset des mocks** : Toujours inclure `beforeEach(() => vi.clearAllMocks())` pour éviter les fuites entre les tests.
    3. **Mocking des requêtes Prisma** : Utiliser `vi.mocked(prisma.[model].[action]).mockResolvedValue(...)` pour simuler un retour de la base.
    4. **Validation des arguments** : Vérifier que Prisma est appelé avec les bons arguments de sécurité, ex : `expect(prisma.classroom.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { schoolId: mockSchoolId } }))`.
    5. **Tests de refus d'accès** : S'assurer que les cas d'erreurs (validation Zod invalide, rôle non autorisé) n'appellent **jamais** Prisma (`expect(prisma.*).not.toHaveBeenCalled()`).

## Processus pour les agents IA

- Une demande = une fonctionnalité complète (Server Action + validation + UI), jamais découpée en micro-étapes séparées.
- Après la première entité codée et validée, les entités suivantes suivent exactement le même pattern (fichier de référence à citer explicitement dans la tâche).
- Toujours préciser les cas limites attendus dans la tâche (erreurs de validation, état de chargement, permissions) plutôt que de laisser l'agent coder seulement le "happy path".
- Avant de clore une tâche, l'agent relit son propre code et vérifie le respect de ces conventions.
- Toute décision structurante nouvelle (rôle, règle métier) doit s'accompagner d'une mise à jour de `docs/domaine-metier.md` dans la même tâche.
