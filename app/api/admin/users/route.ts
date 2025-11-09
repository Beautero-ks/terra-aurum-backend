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
    const where = q ? { OR: [{ email: { contains: q, mode: 'insensitive' as const } }, { fullName: { contains: q, mode: 'insensitive' as const } }] } : undefined
    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, fullName: true, role: true, createdAt: true }, skip, take: limit }),
      prisma.user.count({ where })
    ])
    return NextResponse.json({ users, meta: { page, limit, total } }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('GET /api/admin/users error', err)
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
