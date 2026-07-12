export type DevSeedAccount = {
  role: "SCHOOL_ADMIN" | "PLATFORM_SUPER_ADMIN"
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
    role: "PLATFORM_SUPER_ADMIN",
    label: "Super admin plateforme",
    email: "platform@ecole-app.mg",
    password: "platform123",
  },
]
