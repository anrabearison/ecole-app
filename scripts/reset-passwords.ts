import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

function cleanConnectionString(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove pgbouncer and other Prisma-specific params that the pg driver doesn't understand
    parsed.searchParams.delete("pgbouncer")
    parsed.searchParams.delete("connection_limit")
    parsed.searchParams.delete("pool_timeout")
    parsed.searchParams.delete("connect_timeout")
    parsed.searchParams.delete("socket_timeout")
    parsed.searchParams.delete("schema")
    parsed.searchParams.delete("statement_cache_size")
    return parsed.toString()
  } catch {
    return url
  }
}

function createPrismaClient() {
  const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL!
  const connectionString = cleanConnectionString(rawUrl)
  const pool = new Pool({
    connectionString,
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

async function resetPasswords() {
  const DEFAULT_PASSWORD = "Init12345"
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  console.log("Réinitialisation des mots de passe pour tous les enseignants et élèves...")
  console.log(`Mot de passe par défaut: ${DEFAULT_PASSWORD}`)

  try {
    // Mise à jour des enseignants
    const teachersResult = await prisma.user.updateMany({
      where: {
        role: "TEACHER",
      },
      data: {
        passwordHash,
      },
    })

    console.log(`✓ ${teachersResult.count} enseignants mis à jour`)

    // Mise à jour des élèves
    const studentsResult = await prisma.user.updateMany({
      where: {
        role: "STUDENT",
      },
      data: {
        passwordHash,
      },
    })

    console.log(`✓ ${studentsResult.count} élèves mis à jour`)

    console.log("\n✅ Tous les mots de passe ont été réinitialisés avec succès")
    console.log(`Nouveau mot de passe pour tous: ${DEFAULT_PASSWORD}`)
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des mots de passe:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetPasswords()
