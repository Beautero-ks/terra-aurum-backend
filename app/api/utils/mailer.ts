import nodemailer from 'nodemailer'

export async function sendAdminMail(order: any) {
  // Mail transport: expects ADMIN_EMAIL and ADMIN_EMAIL_PASSWORD in env
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASSWORD) {
    console.warn('Admin email not configured (ADMIN_EMAIL / ADMIN_EMAIL_PASSWORD). Skipping sendAdminMail.')
    return
  }

  const transporter = nodemailer.createTransport({
    host: 'gmail',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_EMAIL_PASSWORD
    },
    connectionTimeout: 10000, // 10 secondes au lieu de 5
    socketTimeout: 10000
  })

  const itemsSummary = Array.isArray(order.items)
    ? order.items.map((it: any, i: number) => `${i + 1}. ${it.name || it.title || 'Item'} x${it.quantity || it.qty || 1} — ${it.price || ''}`).join('\n')
    : JSON.stringify(order.items)

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: `Nouvelle commande ${order.orderNumber || order.id}`,
    text: `Nouvelle commande reçue :\n\nCommande : ${order.orderNumber || order.id}\nUtilisateur : ${order.userEmail || 'N/A'}\nTotal : ${order.total} $\nMode de paiement : ${order.paymentMethod || 'N/A'}\nNombre d'articles : ${Array.isArray(order.items) ? order.items.length : '-'}\nDate : ${order.date}\n\nArticles:\n${itemsSummary}\n\n--\nVoir le panneau d'administration pour plus de détails.`
  }

  await transporter.sendMail(mailOptions)

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
