import { NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma.js'
import { corsHeaders, verifyAdmin } from '../_helpers'

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { status: 200, headers: corsHeaders(request) })
}

export async function GET(request: Request) {
  try {
    await verifyAdmin(request)
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Number(url.searchParams.get('limit') || '20'))
  const q = url.searchParams.get('q') || ''
  const where = q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { category: { contains: q, mode: 'insensitive' as const } }] } : undefined
    const skip = (page - 1) * limit
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: { id: 'desc' }, skip, take: limit }),
      prisma.product.count({ where })
    ])
    return NextResponse.json({ products, meta: { page, limit, total } }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('GET /api/admin/products error', err)
    let status = 500
    let message = 'Server error'
    if (typeof err === 'object' && err !== null) {
      const e = err as { status?: number; message?: string }
      if (e.status) status = e.status
      if (e.message) message = e.message
    } else if (err instanceof Error) {
      message = err.message
    }
    return NextResponse.json({ message }, { status, headers: corsHeaders(request) })
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request)
    const body = await request.json()
    // expected fields: name, description, price, weight, image, category, inStock, specifications
    // Coerce and sanitize incoming data to match Prisma types
    const data = {
      name: body.name ? String(body.name) : '',
      description: body.description ?? null,
      price: body.price !== undefined ? Number(body.price) : 0,
      weight: body.weight !== undefined ? String(body.weight) : null,
      image: body.image ?? null,
      category: body.category ?? null,
      inStock: body.inStock === undefined ? true : Boolean(body.inStock),
      specifications: body.specifications ?? null,
    }

    // Basic validation
    if (!data.name || data.name.trim().length === 0) throw { status: 400, message: 'Le nom du produit est requis' }
    if (typeof data.price !== 'number' || Number.isNaN(data.price) || data.price <= 0) throw { status: 400, message: 'Le prix doit être un nombre positif' }

    const created = await prisma.product.create({ data })
    return NextResponse.json({ product: created }, { status: 201, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('POST /api/admin/products error', err)
    let status = 500
    let message = 'Server error'
    if (typeof err === 'object' && err !== null) {
      const e = err as { status?: number; message?: string }
      if (e.status) status = e.status
      if (e.message) message = e.message
    } else if (err instanceof Error) {
      message = err.message
    }
    return NextResponse.json({ message }, { status, headers: corsHeaders(request) })
  }
}
