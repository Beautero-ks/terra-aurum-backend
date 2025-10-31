import Cors from 'cors'
import type { NextApiRequest, NextApiResponse } from 'next'

const cors = Cors({
  origin: ['http://localhost:5173'], // ton frontend en dev
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) reject(result)
      resolve(result)
    })
  })
}

export default async function applyCors(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, cors)
}
