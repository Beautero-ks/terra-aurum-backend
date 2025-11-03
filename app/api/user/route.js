import { NextResponse } from 'next/server'
import prisma from '../../../prisma/client'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function GET(request) {
  const users = await prisma.user.findMany()
  return NextResponse.json(users)
}

export async function POST(request) {
  const body = await request.json()
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email
    }
  })
  return NextResponse.json(user)
}

export async function PUT(request) {
  const origin = request.headers.get('origin') || '*'
  const auth = request.headers.get('authorization')
  if (!auth) return NextResponse.json({ message: 'No token' }, { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } })
  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, SECRET)
    const body = await request.json()
    const { fullName, phone, address, city, postalCode } = body || {}
    const id = Number(decoded.id)
    const updated = await prisma.user.update({ where: { id }, data: { fullName, phone, address, city, postalCode } })
    const safe = { id: updated.id, email: updated.email, fullName: updated.fullName, phone: updated.phone, address: updated.address, city: updated.city, postalCode: updated.postalCode, memberSince: updated.createdAt }
    return NextResponse.json(safe, { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Credentials': 'true' } })
  } catch (err) {
    console.error('PUT /api/user error', err)
    return NextResponse.json({ message: 'Invalid token or server error' }, { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } })
  }
}
