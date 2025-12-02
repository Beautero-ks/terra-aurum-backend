import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma.js'
import { corsHeaders, verifyAdmin } from '../../_helpers'

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdmin(request)
    const resolved = await context.params
    const id = Number(resolved.id)
    if (Number.isNaN(id)) throw { status: 400, message: 'Invalid id' }

    // Delete related order items first (foreign key constraint) then delete the order.
    // Use a transaction for atomicity.
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } })
    ])
    return NextResponse.json({ message: 'Deleted' }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('DELETE /api/admin/orders/[id] error', err)
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
