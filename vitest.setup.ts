import { vi } from "vitest"

// Mock Next.js modules
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

import { mockDeep, mockReset } from "vitest-mock-extended"
import { PrismaClient } from "@prisma/client"
import { beforeEach } from "vitest"

const prismaMock = mockDeep<PrismaClient>()

beforeEach(() => {
  mockReset(prismaMock)
})

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock
}))
