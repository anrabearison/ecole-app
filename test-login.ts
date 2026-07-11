import "dotenv/config"
import { prisma } from "./lib/prisma"
import bcrypt from "bcryptjs"

async function testLogin() {
  const email = "admin@sekoly-test.mg"
  const password = "motdepasse123"

  console.log("----- TEST SCRIPT -----")
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log("User not found!")
    return
  }

  console.log("User in DB:", { id: user.id, email: user.email, active: user.active })
  console.log("Stored hash:", user.passwordHash)

  const isValid = await bcrypt.compare(password, user.passwordHash)
  console.log("bcrypt.compare(password, hash):", isValid)

  // generate a fresh hash with bcrypt to see if it matches the format
  const newHash = await bcrypt.hash(password, 10)
  console.log("New hash format:", newHash)
}

testLogin().finally(() => prisma.$disconnect())
