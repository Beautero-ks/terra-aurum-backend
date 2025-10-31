import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import applyCors from '../utils/cors'
import prisma from '../../../prisma/client'

const SECRET = process.env.JWT_SECRET || 'dev-secret'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await applyCors(req, res)
  // respond to preflight
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password } = req.body
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: 'User not found' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'Invalid password' })

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '2h' })
    res.status(200).json({ token })
  } catch (err) {
    console.error('Login error', err)
    res.status(500).json({ message: 'Server error' })
  }
}
