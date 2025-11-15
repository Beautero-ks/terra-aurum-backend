import { NextResponse } from 'next/server'
import { prisma } from '../lib/prisma.js'
import jwt from 'jsonwebtoken'

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

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization')
    if (!auth) return NextResponse.json({ message: 'No token' }, { status: 401, headers: corsHeaders(request) })
    const token = auth.split(' ')[1]
    const decoded: any = jwt.verify(token, SECRET)
    const userId = Number(decoded.id)
    // include related items and product data so frontend can render order details
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true }
        }
      }
    })

    // normalize orders to the shape expected by the frontend
    const normalized = orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.total,
      status: o.status,
      trackingNumber: o.trackingNumber || null,
      date: o.createdAt,
      items: (o.items || []).map(it => ({
        id: it.id,
        productId: it.productId,
        name: it.product?.name || null,
        image: it.product?.image || null,
        price: it.price,
        quantity: it.quantity
      }))
    }))

    return NextResponse.json({ orders: normalized }, { status: 200, headers: corsHeaders(request) })
  } catch (err) {
    console.error('GET /api/orders error', err)
    return NextResponse.json({ message: 'Invalid token or server error' }, { status: 401, headers: corsHeaders(request) })
  }
}
