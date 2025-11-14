import { NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma.js'
import jwt from 'jsonwebtoken'
import { sendAdminMail } from '../../utils/mailer'

const SECRET = process.env.JWT_SECRET || 'dev-secret'
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'http://localhost:5173'

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  }
}

function genOrderNumber() {
  return `TA-${Date.now().toString(36).toUpperCase()}`
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization')
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(request) })
    }
    const token = auth.split(' ')[1]
    let userId: number
    try {
      const decoded = jwt.verify(token, SECRET) as { id?: string }
      if (!decoded?.id) throw new Error('No id in token')
      userId = Number(decoded.id)
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders(request) })
    }

    const body = await request.json()
  const { items, total, userEmail: bodyEmail, paymentMethod } = body || {}
    const userEmail: string | null = bodyEmail || null

    // validate payload shape
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid payload: items must be a non-empty array' }, { status: 400, headers: corsHeaders(request) })
    }
    const totalNum = Number(total)
    if (Number.isNaN(totalNum) || totalNum < 0) {
      return NextResponse.json({ error: 'Invalid payload: total must be a number' }, { status: 400, headers: corsHeaders(request) })
    }

    const orderNumber = genOrderNumber()

    // Build nested create items for Prisma OrderItem relation
    const itemsForCreate = items.map((it: any) => {
      const productId = Number(it.id ?? it.productId)
      const quantity = Number(it.quantity ?? 1)
      const price = Number(it.price ?? 0)
      if (Number.isNaN(productId) || Number.isNaN(quantity) || Number.isNaN(price)) {
        throw new Error('Invalid item data')
      }
      return {
        product: { connect: { id: productId } },
        quantity,
        price
      }
    })

    const created = await prisma.order.create({
      data: {
        userId: Number(userId),
        total: totalNum,
        orderNumber,
        items: { create: itemsForCreate }
      },
      include: { items: true }
    })

    const payloadForMail = {
      id: created.id,
      orderNumber: created.orderNumber,
      userId: created.userId,
      userEmail: userEmail,
      total: created.total,
      items,
      paymentMethod: paymentMethod || null,
      date: created.createdAt.toISOString()
    }

    // send admin mail in background (don't fail request if mail fails)
    sendAdminMail(payloadForMail).catch(err => console.error('sendAdminMail error', err))

    return NextResponse.json({ message: 'Order created', order: payloadForMail }, { status: 201, headers: corsHeaders(request) })
  } catch (err) {
    console.error('Create order error', err)
  return NextResponse.json({ error: 'Server error' }, { status: 500, headers: corsHeaders(request) })
  }
}
