import { NextResponse } from 'next/server'
import { prisma } from '../lib/prisma.js'
import { corsHeaders } from '../admin/_helpers'

// NOTE: This API MUST return products from the database only. Do NOT return example
// or bundled static products from here. If the DB is unreachable we return an error so
// the frontend can surface it and avoid displaying non-authoritative example data.

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { status: 200, headers: corsHeaders(request) })
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Number(url.searchParams.get('limit') || '12'))
    const q = url.searchParams.get('q') || ''
    const where = q ? { OR: [
      { name: { contains: q, mode: 'insensitive' as const } },
      { category: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } }
    ] } : undefined

    const skip = (page - 1) * limit
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: { id: 'desc' }, skip, take: limit }),
      prisma.product.count({ where })
    ])
    // Debug: log server-side pagination and returned ids to help diagnose issues
    try {
      console.debug('[API /products] page=%d limit=%d skip=%d returned=%d ids=%o', page, limit, skip, Array.isArray(products) ? products.length : 0, Array.isArray(products) ? products.map(p => p.id) : [])
    } catch {}
    return NextResponse.json({ products, meta: { page, limit, total } }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('GET /api/products error', err)
    let status = 500
    let message = 'Server error'
    if (typeof err === 'object' && err !== null) {
      const e = err as { status?: number; message?: string }
      if (e.status) status = e.status
      if (e.message) message = e.message
    } else if (err instanceof Error) {
      message = err.message
    }
    // Return an explicit error response (do NOT return example products)
    return NextResponse.json({ message }, { status, headers: corsHeaders(request) })
  }
}
