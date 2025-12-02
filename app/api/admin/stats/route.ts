import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma.js'
import { corsHeaders, verifyAdmin } from '../_helpers'

export async function GET(request: Request) {
  try {
    await verifyAdmin(request)
    const [products, users, orders] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count()
    ])
    return NextResponse.json({ products, users, orders }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('GET /api/admin/stats error', err)
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
