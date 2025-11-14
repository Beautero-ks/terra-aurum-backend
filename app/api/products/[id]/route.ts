import { NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma.js'
import { corsHeaders } from '../../admin/_helpers'

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { status: 200, headers: corsHeaders(request) })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    let id = Number(params.id)
    if (Number.isNaN(id)) {
      // try to parse from URL path as fallback
      try {
        const u = new URL(request.url)
        const parts = u.pathname.split('/').filter(Boolean)
        const last = parts[parts.length - 1]
        id = Number(last)
      } catch {
        // ignore
      }
    }
    if (Number.isNaN(id)) return NextResponse.json({ message: 'Invalid id' }, { status: 400, headers: corsHeaders(request) })

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ message: 'Not found' }, { status: 404, headers: corsHeaders(request) })
    return NextResponse.json({ product }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('GET /api/products/[id] error', err)
    const status = 500
    let message = 'Server error'
    if (err instanceof Error) message = err.message
    return NextResponse.json({ message }, { status, headers: corsHeaders(request) })
  }
}
