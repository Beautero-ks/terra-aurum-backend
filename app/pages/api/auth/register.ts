import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import applyCors from '../utils/cors'
import prisma from '../../../../prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await applyCors(req, res)
  // respond to preflight
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { fullName, email, password } = req.body || {}
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'fullName, email and password are required' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Un compte avec cet email existe déjà' })

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        email,
        fullName,
        password: passwordHash
      }
    })

    return res.status(201).json({ success: true })
  } catch (err) {
    console.error('Register error', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
