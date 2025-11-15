import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma.js'
import { corsHeaders, verifyAdmin } from '../../_helpers'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);

    const resolvedParams = await context.params;
    const { id: idString } = resolvedParams;
    const id = parseInt(idString, 10);

    const body = await request.json();

    // Allow updating role and fullName (careful with password changes)
    const allowed: Partial<{ role: string; fullName: string }> = {};
    if (body.role) allowed.role = body.role;
    if (body.fullName) allowed.fullName = body.fullName;

    const updated = await prisma.user.update({
      where: { id },
      data: allowed,
    });

    return NextResponse.json(
      {
        user: {
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          role: updated.role,
        },
      },
      { status: 200, headers: corsHeaders(request) }
    );
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 500;
    const message = (err as { message?: string })?.message || 'Server error';
    return NextResponse.json(
      { message },
      { status, headers: corsHeaders(request) }
    );
  }
}
