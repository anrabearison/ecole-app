// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const school = await prisma.school.create({
    data: { name: "Sekoly Test", address: "Amboavory" },
  })

  const passwordHash = await bcrypt.hash("motdepasse123", 10)

  await prisma.user.create({
    data: {
      email: "admin@sekoly-test.mg",
      passwordHash,
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
    },
  })

  console.log("Seed terminé :", school.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())