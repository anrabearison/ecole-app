import { vi, beforeEach } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"
import { PrismaClient } from "@prisma/client"

// Shared Prisma mock — reset before each test to prevent state leakage
const prismaMock = mockDeep<PrismaClient>()

beforeEach(() => {
  mockReset(prismaMock)
})

// Mock Next.js server auth (prevents Node/pg modules leaking into test runner)
vi.mock("next-auth", () => ({
  default: () => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  }),
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}))

// Override Prisma client with the shared mock
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))
