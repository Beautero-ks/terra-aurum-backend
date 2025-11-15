import { NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma.js'
import { corsHeaders, verifyAdmin } from '../_helpers'

export async function GET(request: Request) {
  try {
    await verifyAdmin(request)
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Number(url.searchParams.get('limit') || '20'))
    const q = url.searchParams.get('q') || ''
    const where = q ? { OR: [{ orderNumber: { contains: q } }, { status: { contains: q } }] } : undefined
    const skip = (page - 1) * limit
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include: { user: { select: { id: true, email: true, fullName: true } }, items: true } }),
      prisma.order.count({ where })
    ])
    return NextResponse.json({ orders, meta: { page, limit, total } }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    
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
