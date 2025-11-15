import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
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
    'Content-Type': 'application/json'
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body || {}
    if (!email || !password) return NextResponse.json({ message: 'Missing credentials' }, { status: 400, headers: corsHeaders(request) })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 401, headers: corsHeaders(request) })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ message: 'Invalid password' }, { status: 401, headers: corsHeaders(request) })

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '2h' })
    return NextResponse.json({ token }, { status: 200, headers: corsHeaders(request) })
  } catch (err) {
    console.error('Login (app router) error', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers: corsHeaders(request) })
  }
}
