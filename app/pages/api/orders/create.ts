import type { NextApiRequest, NextApiResponse } from 'next'
import applyCors from '../utils/cors'
import { orders } from '../utils/fakeDB'
import { sendAdminMail } from '../utils/mailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await applyCors(req, res)

  // respond to preflight
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).end()

  const { userEmail, items, total } = req.body
  const order = {
    id: Date.now(),
    userEmail,
    items,
    total,
    date: new Date().toISOString()
  }
  orders.push(order)
  
  await sendAdminMail(order) // 👈 envoie un mail à l’admin
  res.status(201).json({ message: 'Order created successfully', order })
}
