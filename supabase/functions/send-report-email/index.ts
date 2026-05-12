// Supabase Edge Function: send-report-email
// Sends a progress report email via Resend API

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  to: string
  athleteName: string
  coachName: string
  pdfBase64: string
  season: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization header' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: EmailPayload = await req.json()
    const { to, athleteName, coachName, pdfBase64, season = '2025/26' } = body

    if (!to || !athleteName || !coachName || !pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, athleteName, coachName, pdfBase64' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Resend API key not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Build email content
    const htmlBody = `
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
    `

    const filename = `${athleteName.replace(/\s+/g, '_')}_Progress_Report.pdf`

    // Build Resend API payload
    const resendPayload = {
      from: 'Freestyle Vancouver <info@vancouverfreestyle.com>',
      to: [to],
      subject: `${athleteName} - Freestyle Vancouver Progress Report ${season}`,
      html: htmlBody,
      attachments: [
        {
          content: pdfBase64,
          filename,
        },
      ],
    }

    // Call Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    })

    const responseData = await response.json()

    if (response.ok) {
      return new Response(
        JSON.stringify({ success: true, id: responseData.id }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Error response
    const errorMessage = responseData?.message || `Resend returned status ${response.status}`

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
