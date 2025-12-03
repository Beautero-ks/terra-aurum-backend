import sgMail from '@sendgrid/mail'

export async function sendAdminMail(order: any) {
  // SendGrid API configuration
  const sendgridKey = process.env.RENDER_MAILER_KEY
  const mailFrom = process.env.MAIL_FROM

  if (!sendgridKey || !mailFrom) {
    console.warn('SendGrid email not configured (RENDER_MAILER_KEY / MAIL_FROM). Skipping sendAdminMail.')
    return
  }

  sgMail.setApiKey(sendgridKey)

  const itemsSummary = Array.isArray(order.items)
    ? order.items.map((it: any, i: number) => `${i + 1}. ${it.name || it.title || 'Item'} x${it.quantity || it.qty || 1} — ${it.price || ''}`).join('\n')
    : JSON.stringify(order.items)

  const msg = {
    to: mailFrom,
    from: mailFrom,
    subject: `Nouvelle commande ${order.orderNumber || order.id}`,
    text: `Nouvelle commande reçue :\n\nCommande : ${order.orderNumber || order.id}\nUtilisateur : ${order.userEmail || 'N/A'}\nTotal : ${order.total} $\nMode de paiement : ${order.paymentMethod || 'N/A'}\nNombre d'articles : ${Array.isArray(order.items) ? order.items.length : '-'}\nDate : ${order.date}\n\nArticles:\n${itemsSummary}\n\n--\nVoir le panneau d'administration pour plus de détails.`
  }

  try {
    await sgMail.send(msg)
    console.log(`✅ E-mail pour la commande ${order.orderNumber} envoyé via SendGrid.`)
  } catch (error) {
    let errorMessage = "Erreur inconnue lors de l'envoi du mail.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    console.error('❌ Échec critique de sendAdminMail (SendGrid). Détails de l\'erreur :', errorMessage);
    console.error(error);
  }
}

