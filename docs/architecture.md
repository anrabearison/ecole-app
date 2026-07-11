# Architecture technique

> Convention : tout le code (variables, fonctions, modèles Prisma, champs) est nommé en **anglais**.
> Seuls les contenus destinés à l'utilisateur final (libellés UI, messages d'erreur) peuvent être en français.

## Stack

- **Framework** : Next.js 15 (App Router), TypeScript strict
- **Base de données** : PostgreSQL (Vercel Postgres ou Neon)
- **ORM** : Prisma 7 — la connexion DB se configure dans `prisma.config.ts` (pas de `url` dans `schema.prisma`, propriété supprimée en v7)
- **Authentification** : Auth.js (NextAuth v5) — session doit transporter `role` et `schoolId`
- **UI** : Tailwind CSS + shadcn/ui
- **Formulaires** : React Hook Form + Zod
- **Tableaux** : TanStack Table
- **Data fetching client** : TanStack Query (uniquement si besoin réel d'interactivité, voir plus bas)
- **Emails** : Resend + React Email
- **Tests unitaires/intégration** : Vitest + React Testing Library
- **Tests E2E** : Playwright
- **Déploiement** : Vercel (plan Hobby pour l'instant — usage interne gratuit, à réévaluer si usage commercial ou multi-utilisateurs de l'équipe dev)

## Patterns de data fetching / mutation

| Cas d'usage | Outil |
|---|---|
| Affichage initial d'une page (liste, dashboard) | Server Component (`await prisma...` direct dans la page) |
| Créer / modifier / supprimer une donnée | Server Action |
| Recherche live, filtres dynamiques sans rechargement | TanStack Query |
| Rafraîchir l'affichage après une mutation | `revalidatePath()` ou `router.refresh()` |

Ne pas ajouter TanStack Query par défaut — seulement quand un écran a un besoin réel de cache/refetch côté client.

## Multi-tenant (École)

- Toute entité métier appartient à une école via `schoolId`.
- Un utilisateur appartient à **une seule** école (`schoolId` sur `User`), sauf le rôle `PLATFORM_SUPER_ADMIN` (`schoolId` null).
- **Toute requête Prisma sur une entité scopée doit filtrer par `schoolId`.** Ne jamais faire confiance à un `schoolId` transmis par le client — il vient toujours de la session serveur.
- Utiliser une fonction wrapper (ex. `prismaForSchool(schoolId)` via Prisma Client Extensions) pour rendre ce filtre systématique plutôt que manuel à chaque requête.

```ts
// lib/prisma.ts
export function prismaForSchool(schoolId: string) {
  return prisma.$extends({
    query: {
      classroom: {
        async findMany({ args, query }) {
          args.where = { ...args.where, schoolId }
          return query(args)
        },
      },
      // répéter pour chaque modèle scopé par école
    },
  })
}
```

## Permissions (RBAC)

- Toute vérification de permission passe par une fonction centrale unique : `lib/permissions.ts::can()`.
- Jamais de vérification de rôle inline dans un composant ou une Server Action sans passer par `can()`.
- Le rôle et le `schoolId` sont **toujours** lus depuis la session serveur (`auth()`), jamais reçus du client.
- Toute Server Action de mutation appelle `can()` avant d'écrire en base.
- Toute requête de type `findMany` filtre selon le rôle et l'école — jamais de filtrage côté client après un fetch non filtré.
- L'affichage conditionnel côté UI (masquer un bouton) n'est **jamais** une mesure de sécurité — la vérification serveur reste obligatoire dans tous les cas.

```ts
// lib/permissions.ts
type Action = "create" | "update" | "delete" | "view"
type Resource = "student" | "grade" | "classroom" | "user" | "schedule"

export function can(
  role: Role,
  action: Action,
  resource: Resource,
  context?: { ownerId?: string; userId?: string }
): boolean {
  if (role === "PLATFORM_SUPER_ADMIN") return true
  // ... voir docs/domaine-metier.md pour le détail des règles par rôle
}
```

## Structure de dossiers

```
app/
  (auth)/
    login/
  (dashboard)/
    admin/                  # PLATFORM_SUPER_ADMIN, SCHOOL_ADMIN, STAFF_ADMIN
      users/
      classrooms/
      settings/
    teacher/                # TEACHER
      my-classrooms/
      grades/
      schedule/
    student/                # STUDENT
      my-grades/
      schedule/
components/
  ui/                        # composants shadcn
lib/
  actions/                   # Server Actions, un fichier par domaine
  validations/                # schémas Zod, un fichier par domaine
  permissions.ts
  navigation.ts
  auth.ts
  prisma.ts
prisma/
  schema.prisma
e2e/
docs/
  architecture.md
  domaine-metier.md
  conventions.md
```

## Interface par rôle

- Un dossier de route par contexte de rôle : `admin/`, `teacher/`, `student/`.
- Vérification du rôle au niveau du layout de chaque groupe de routes, pas répétée sur chaque page.
- Navigation générée dynamiquement depuis `lib/navigation.ts` (filtrée par rôle), jamais codée en dur par écran.
- Composants UI neutres : ils reçoivent des props (`canEdit`, `canDelete`) et ne connaissent jamais le rôle eux-mêmes.

```ts
// lib/navigation.ts
const navItems = [
  { label: "Élèves", href: "/admin/students", roles: ["SCHOOL_ADMIN", "STAFF_ADMIN"] },
  { label: "Mes classes", href: "/teacher/my-classrooms", roles: ["TEACHER"] },
  { label: "Mes notes", href: "/student/my-grades", roles: ["STUDENT"] },
]

export function getNavForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role))
}
```
