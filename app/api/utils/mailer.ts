import nodemailer from 'nodemailer'

export async function sendAdminMail(order: any) {
  // Mail transport: expects ADMIN_EMAIL and ADMIN_EMAIL_PASSWORD in env
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASSWORD) {
    console.warn('Admin email not configured (ADMIN_EMAIL / ADMIN_EMAIL_PASSWORD). Skipping sendAdminMail.')
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_EMAIL_PASSWORD
    }
  })

  const itemsSummary = Array.isArray(order.items)
    ? order.items.map((it: any, i: number) => `${i + 1}. ${it.name || it.title || 'Item'} x${it.quantity || it.qty || 1} — ${it.price || ''}`).join('\n')
    : JSON.stringify(order.items)

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: `Nouvelle commande ${order.orderNumber || order.id}`,
    text: `Nouvelle commande reçue :\n\nCommande : ${order.orderNumber || order.id}\nUtilisateur : ${order.userEmail || 'N/A'}\nTotal : ${order.total} €\nNombre d'articles : ${Array.isArray(order.items) ? order.items.length : '-'}\nDate : ${order.date}\n\nArticles:\n${itemsSummary}\n\n--\nVoir le panneau d'administration pour plus de détails.`
  }

  await transporter.sendMail(mailOptions)
}
