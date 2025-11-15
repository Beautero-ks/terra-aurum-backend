import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '../../lib/prisma.js'

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
    const { fullName, email, password } = body || {}
    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'fullName, email and password are required' }, { status: 400, headers: corsHeaders(request) })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Un compte avec cet email existe déjà' }, { status: 400, headers: corsHeaders(request) })

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({ data: { email, fullName, password: passwordHash } })

    return NextResponse.json({ success: true }, { status: 201, headers: corsHeaders(request) })
  } catch (err) {
    console.error('Register (app router) error', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500, headers: corsHeaders(request) })
  }
}
