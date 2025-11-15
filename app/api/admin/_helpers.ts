import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

const SECRET = process.env.JWT_SECRET || '8e012340284be0f75d6e14bf068c06b6'
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'https://terra-aurum.com'

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

export async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) throw { status: 401, message: 'No token' }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, SECRET) as { id?: string }
    const user = await prisma.user.findUnique({ where: { id: Number(decoded.id) } })
    if (!user) throw { status: 401, message: 'User not found' }
    if (user.role !== 'admin') throw { status: 403, message: 'Admin access required' }
    return user
  } catch {
    throw { status: 401, message: 'Invalid token' }
  }
}
