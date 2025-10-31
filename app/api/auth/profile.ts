import type { NextApiRequest, NextApiResponse } from 'next'

// Deprecated: API has moved to the app router at /api/auth/profile (app/api/auth/profile/route.ts)
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json')
  res.status(410).json({ error: 'Deprecated. Use /api/auth/profile (app router).' })
}
