import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma.js'
import { corsHeaders, verifyAdmin } from '../../_helpers'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request)
    const id = Number(params.id)
    const body = await request.json()
    // allow updating role and fullName (careful with password changes)
    const allowed: any = {}
    if (body.role) allowed.role = body.role
    if (body.fullName) allowed.fullName = body.fullName
    const updated = await prisma.user.update({ where: { id }, data: allowed })
    return NextResponse.json({ user: { id: updated.id, email: updated.email, fullName: updated.fullName, role: updated.role } }, { status: 200, headers: corsHeaders(request) })
  } catch (err: any) {
    const status = err?.status || 500
    return NextResponse.json({ message: err?.message || 'Server error' }, { status, headers: corsHeaders(request) })
  }
}
