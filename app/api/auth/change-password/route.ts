import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma.js'

const SECRET = process.env.JWT_SECRET || 'dev-secret'
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'http://localhost:5173'

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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ message: 'No token' }, { status: 401, headers: corsHeaders(request) })

    const token = authHeader.split(' ')[1]
    const decoded: any = jwt.verify(token, SECRET)
    const userId = Number(decoded.id)
    if (!userId) return NextResponse.json({ message: 'Invalid token' }, { status: 401, headers: corsHeaders(request) })

    const body = await request.json()
    const { newPassword, currentPassword } = body || {}
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ message: 'New password must be at least 8 characters' }, { status: 400, headers: corsHeaders(request) })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404, headers: corsHeaders(request) })

    // If currentPassword provided, verify it
    if (currentPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) return NextResponse.json({ message: 'Current password is incorrect' }, { status: 401, headers: corsHeaders(request) })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

    return NextResponse.json({ success: true, message: 'Password updated' }, { status: 200, headers: corsHeaders(request) })
  } catch (err) {
    console.error('POST /api/auth/change-password error', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers: corsHeaders(request) })
  }
}
