import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

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
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
