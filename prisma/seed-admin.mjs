import { PrismaClient } from '../app/generated/prisma/index.js'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Seeding admin in production is not recommended.')
  }

  const email = 'terraaurum@gmail.com'
  const password = 'Terra-aurum&'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Admin user already exists:', existing.email)
    return
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      fullName: 'Terra Aurum Admin',
      email,
      password: hashed,
      role: 'admin'
    }
  })

  console.log('Created admin user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
