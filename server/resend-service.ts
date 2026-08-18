import { Resend } from 'resend';

const ADMIN_EMAIL = 'pablomartino94@gmail.com';

export async function sendNewUserNotification(userEmail: string): Promise<void> {
  console.log(`[Resend] Attempting to send notification for new user: ${userEmail}`);
  
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[Resend] RESEND_API_KEY not configured');
    return;
  }

  try {
    const client = new Resend(apiKey);
    
    const now = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    
    const result = await client.emails.send({
      from: 'Remis Control <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: 'Nuevo usuario registrado en Remis Control',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nuevo Usuario Registrado</h2>
          <p>Se ha registrado un nuevo usuario en <strong>Remis Control</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Email del usuario:</strong> ${userEmail}</p>
            <p style="margin: 8px 0 0 0;"><strong>Fecha de registro:</strong> ${now}</p>
          </div>
          <p>Por favor, configura la facturación para este usuario desde el panel de administración.</p>
          <p style="color: #6b7280; font-size: 14px;">— Remis Control</p>
        </div>
      `,
      text: `Nuevo usuario registrado en Remis Control\n\nEmail del usuario: ${userEmail}\nFecha de registro: ${now}\n\nPor favor, configura la facturación para este usuario desde el panel de administración.`
    });

    console.log(`[Resend] Notification sent to ${ADMIN_EMAIL} for new user: ${userEmail}`, JSON.stringify(result));
  } catch (error: any) {
    console.error('[Resend] Failed to send new user notification:', error?.message || error);
  }
}
