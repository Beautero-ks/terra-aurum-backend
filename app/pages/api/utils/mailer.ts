import nodemailer from 'nodemailer'

export async function sendAdminMail(order: any) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_EMAIL_PASSWORD
    }
  })

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: `Nouvelle commande #${order.id}`,
    text: `
Nouvelle commande reçue :
Utilisateur : ${order.userEmail}
Total : ${order.total} €
Nombre d'articles : ${order.items.length}
Date : ${order.date}
`
  }

  await transporter.sendMail(mailOptions)
}
