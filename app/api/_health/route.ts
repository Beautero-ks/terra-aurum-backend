import { NextResponse } from 'next/server'
import { prisma } from '../lib/prisma.js'
import { corsHeaders } from '../admin/_helpers'

export async function GET(request: Request) {
  try {
    // Try to connect and run a tiny query
    await prisma.$connect()
    // A small safe query to validate DB connectivity
    const result = await prisma.$queryRaw`SELECT 1 as ok`
    await prisma.$disconnect()
    return NextResponse.json({ ok: true, result }, { status: 200, headers: corsHeaders(request) })
  } catch (err: unknown) {
    
    let message = 'DB connection failed'
    if (err instanceof Error) message = err.message
    return NextResponse.json({ ok: false, message }, { status: 500, headers: corsHeaders(request) })
  }
}
