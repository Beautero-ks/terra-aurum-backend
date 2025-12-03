import nodemailer from 'nodemailer'

export async function sendAdminMail(order: any) {
  // Mail transport: SendGrid configuration via environment variables
  const mailHost = process.env.MAIL_HOST || 'smtp.sendgrid.net'
  const mailPort = parseInt(process.env.MAIL_PORT || '587', 10)
  const mailUser = process.env.MAIL_USER || 'apikey'
  const mailPass = process.env.RENDER_MAILER_KEY
  const mailFrom = process.env.MAIL_FROM

  if (!mailPass || !mailFrom) {
    console.warn('SendGrid email not configured (RENDER_MAILER_KEY / MAIL_FROM). Skipping sendAdminMail.')
    return
  }

  const transporter = nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: mailPort === 465, // Use TLS for port 587
    auth: {
      user: mailUser,
      pass: mailPass
    },
    connectionTimeout: 10000,
    socketTimeout: 10000
  })

  const itemsSummary = Array.isArray(order.items)
    ? order.items.map((it: any, i: number) => `${i + 1}. ${it.name || it.title || 'Item'} x${it.quantity || it.qty || 1} — ${it.price || ''}`).join('\n')
    : JSON.stringify(order.items)

  const mailOptions = {
    from: mailFrom,
    to: mailFrom,
    subject: `Nouvelle commande ${order.orderNumber || order.id}`,
    text: `Nouvelle commande reçue :\n\nCommande : ${order.orderNumber || order.id}\nUtilisateur : ${order.userEmail || 'N/A'}\nTotal : ${order.total} $\nMode de paiement : ${order.paymentMethod || 'N/A'}\nNombre d'articles : ${Array.isArray(order.items) ? order.items.length : '-'}\nDate : ${order.date}\n\nArticles:\n${itemsSummary}\n\n--\nVoir le panneau d'administration pour plus de détails.`
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ E-mail pour la commande ${order.orderNumber} envoyé. ID: ${info.messageId}`)
  } catch (error) {
    // 💥 C'est ici que l'erreur sera visible !
    
    // --- Ligne corrigée ci-dessous ---
    let errorMessage = "Erreur inconnue lors de l'envoi du mail.";

    // Vérification si l'objet 'error' est une instance de la classe Error
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Affichage de l'erreur
    console.error('❌ Échec critique de sendAdminMail. Détails de l\'erreur :', errorMessage);
    
    // Loggez l'objet d'erreur complet pour le diagnostic
    console.error(error); 
  }
}
