export type DevSeedAccount = {
  role: "SCHOOL_ADMIN" | "PLATFORM_SUPER_ADMIN" | "STAFF_ADMIN" | "TEACHER" | "STUDENT"
  label: string
  email: string
  password: string
}

export const devSeedAccounts: DevSeedAccount[] = [
  {
    role: "SCHOOL_ADMIN",
    label: "Administrateur école",
    email: "admin@sekoly-test.mg",
    password: "motdepasse123",
  },
  {
    role: "STAFF_ADMIN",
    label: "Personnel administratif",
    email: "staff@sekoly-test.mg",
    password: "motdepasse123",
  },
  {
    role: "PLATFORM_SUPER_ADMIN",
    label: "Super admin plateforme",
    email: "platform@ecole-app.mg",
    password: "platform123",
  },
  {
    role: "TEACHER",
    label: "Professeur",
    email: "prof@sekoly-test.mg",
    password: "motdepasse123",
  },
  {
    role: "STUDENT",
    label: "Élève",
    email: "eleve@sekoly-test.mg",
    password: "motdepasse123",
  },
]
