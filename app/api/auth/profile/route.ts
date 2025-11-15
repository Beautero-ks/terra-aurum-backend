import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma.js'

const SECRET = process.env.JWT_SECRET || '8e012340284be0f75d6e14bf068c06b6'
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'https://terra-aurum.com'

function corsHeaders(request: Request) {
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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ message: 'No token' }, { status: 401, headers: corsHeaders(request) })

  const token = authHeader.split(' ')[1]
  const decoded = jwt.verify(token, SECRET) as { id?: string }
  const user = await prisma.user.findUnique({ where: { id: Number(decoded.id) } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 401, headers: corsHeaders(request) })
    // return safe user fields for frontend
    const safe = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone || null,
      address: user.address || null,
      city: user.city || null,
      postalCode: user.postalCode || null,
  memberSince: user.createdAt ? user.createdAt.toISOString() : null
    }
    return NextResponse.json(safe, { status: 200, headers: corsHeaders(request) })
  } catch (err) {
    console.error('Profile (app router) error', err)
    return NextResponse.json({ message: 'Invalid token' }, { status: 401, headers: corsHeaders(request) })
  }
}
