import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma.js'
import type { Prisma } from '../../../../generated/prisma'
import { corsHeaders, verifyAdmin } from '../../_helpers'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request)
    let id = Number(params.id)
    // If params.id is not provided (hot reloads or mismatch), try to parse from URL path
    if (Number.isNaN(id)) {
      try {
        const u = new URL(request.url)
        const parts = u.pathname.split('/').filter(Boolean)
        const last = parts[parts.length - 1]
        id = Number(last)
      } catch {
        // ignore - will be handled below
      }
    }
    if (Number.isNaN(id)) throw { status: 400, message: 'Invalid id' }
  const body = await request.json()

    // Remove immutable/primary fields from update payload
    if (body && typeof body === 'object' && 'id' in body) delete body.id

    // Coerce fields similar to POST handler
    const data = {
      name: body.name ? String(body.name) : undefined,
      description: body.description ?? undefined,
      price: body.price !== undefined ? Number(body.price) : undefined,
      weight: body.weight !== undefined ? String(body.weight) : undefined,
      image: body.image ?? undefined,
      category: body.category ?? undefined,
      inStock: body.inStock === undefined ? undefined : Boolean(body.inStock),
      specifications: body.specifications ?? undefined,
    }

    // Remove undefined keys so Prisma won't try to set them
    const cleanedData: Record<string, unknown> = {}
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) cleanedData[k] = v
    })

    // Basic validation
    if ('name' in cleanedData && (!cleanedData.name || String(cleanedData.name).trim().length === 0)) throw { status: 400, message: "Le nom du produit est requis" }
    if ('price' in cleanedData) {
      const p = Number(cleanedData.price)
      if (Number.isNaN(p) || p <= 0) throw { status: 400, message: 'Le prix doit être un nombre positif' }
      cleanedData.price = p
    }

    const updated = await prisma.product.update({ where: { id }, data: cleanedData as unknown as Prisma.ProductUpdateInput })
    return NextResponse.json({ product: updated }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('PUT /api/admin/products/[id] error', err)
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request)
    let id = Number(params.id)
    if (Number.isNaN(id)) {
      try {
        const u = new URL(request.url)
        const parts = u.pathname.split('/').filter(Boolean)
        const last = parts[parts.length - 1]
        id = Number(last)
      } catch {
        // ignore
      }
    }
    if (Number.isNaN(id)) throw { status: 400, message: 'Invalid id' }

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    console.error('DELETE /api/admin/products/[id] error', err)
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
