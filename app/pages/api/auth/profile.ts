import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import applyCors from '../utils/cors'
import prisma from '../../../../prisma/client'

const SECRET = process.env.JWT_SECRET || 'dev-secret'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await applyCors(req, res)
  // respond to preflight
  if (req.method === 'OPTIONS') return res.status(200).end()

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: 'No token' })

  const token = authHeader.split(' ')[1]
  try {
    const decoded: any = jwt.verify(token, SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) throw new Error('User not found')
    res.status(200).json({ email: user.email, role: user.role })
  } catch (err) {
    console.error('Profile error', err)
    res.status(401).json({ message: 'Invalid token' })
  }
}
