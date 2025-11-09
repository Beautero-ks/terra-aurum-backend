import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma.js'
import { corsHeaders, verifyAdmin } from '../../../_helpers'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request)
    let id = Number(params.id)
    if (Number.isNaN(id)) {
      try {
        const u = new URL(request.url)
        const parts = u.pathname.split('/').filter(Boolean)
        const last = parts[parts.length - 2] // path is .../orders/{id}/validate
        id = Number(last)
      } catch {
        // ignore
      }
    }
    if (Number.isNaN(id)) throw { status: 400, message: 'Invalid id' }

    const updated = await prisma.order.update({ where: { id }, data: { status: 'validated' } })
    return NextResponse.json({ order: updated }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('POST /api/admin/orders/[id]/validate error', err)
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
