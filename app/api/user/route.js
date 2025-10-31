import prisma from "../../../prisma/client";
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function GET() {
  const users = await prisma.user.findMany();
  return Response.json(users);
}

export async function POST(req) {
  const body = await req.json();
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
    },
  });
  return Response.json(user);
}

export async function PUT(req) {
  const origin = req.headers.get('origin') || '*'
  const auth = req.headers.get('authorization')
  if (!auth) return new Response(JSON.stringify({ message: 'No token' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } })
  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, SECRET)
    const body = await req.json()
    const { fullName, phone, address, city, postalCode } = body || {}
    const id = Number(decoded.id)
    const updated = await prisma.user.update({ where: { id }, data: { fullName, phone, address, city, postalCode } })
    // remove sensitive fields
    const safe = { id: updated.id, email: updated.email, fullName: updated.fullName, phone: updated.phone, address: updated.address, city: updated.city, postalCode: updated.postalCode, memberSince: updated.memberSince }
    return new Response(JSON.stringify(safe), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Credentials': 'true' } })
  } catch (err) {
    console.error('PUT /api/user error', err)
    return new Response(JSON.stringify({ message: 'Invalid token or server error' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } })
  }
}
