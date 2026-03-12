import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

interface EmailAttachment {
  content: string // base64 encoded
  filename: string
  type: string
  disposition: string
}

interface SendReportCardEmailParams {
  to: string
  athleteName: string
  coachName: string
  pdfBase64: string
  season?: string
}

export async function sendReportCardEmail({
  to,
  athleteName,
  coachName,
  pdfBase64,
  season = '2025/26'
}: SendReportCardEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: 'SendGrid API key not configured' }
  }

  const msg = {
    to,
    from: 'info@vancouverfreestyle.com', // Your verified sender
    subject: `${athleteName} - Freestyle Vancouver Progress Report ${season}`,
    text: `Dear Parent/Guardian,

Please find attached the progress report for ${athleteName} from the Freestyle Vancouver ${season} season.

This report was prepared by Coach ${coachName} and includes skill evaluations, goals, and recommendations for continued development.

If you have any questions about this report, please contact your coach or reply to this email.

Congratulations on a great season!

Best regards,
Freestyle Vancouver Team
info@vancouverfreestyle.com`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Freestyle Vancouver Progress Report</h2>
        <p>Dear Parent/Guardian,</p>
        <p>Please find attached the progress report for <strong>${athleteName}</strong> from the Freestyle Vancouver <strong>${season}</strong> season.</p>
        <p>This report was prepared by Coach <strong>${coachName}</strong> and includes:</p>
        <ul>
          <li>Skill evaluations across multiple categories</li>
          <li>Goals and comments for the season</li>
          <li>Recommended training programs</li>
          <li>Suggestions for next season</li>
        </ul>
        <p>If you have any questions about this report, please contact your coach or reply to this email.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">Congratulations on a great season!</p>
        </div>
        <p>Best regards,<br>
        <strong>Freestyle Vancouver Team</strong><br>
        <a href="mailto:info@vancouverfreestyle.com">info@vancouverfreestyle.com</a></p>
      </div>
    `,
    attachments: [
      {
        content: pdfBase64,
        filename: `${athleteName.replace(/\s+/g, '_')}_Progress_Report.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      } as EmailAttachment
    ]
  }

  try {
    await sgMail.send(msg)
    return { success: true }
  } catch (error: any) {
    console.error('SendGrid error:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

export default sendReportCardEmail
