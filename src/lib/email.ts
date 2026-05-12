import { supabase } from './supabase'

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
  try {
    const { data, error } = await supabase.functions.invoke('send-report-email', {
      body: { to, athleteName, coachName, pdfBase64, season }
    })

    if (error) {
      console.error('Edge function error:', error)
      return { success: false, error: error.message || 'Failed to send email' }
    }

    if (data?.success === false) {
      return { success: false, error: data.error || 'Failed to send email' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

export default sendReportCardEmail
