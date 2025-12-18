import nodemailer from 'nodemailer'

type SendEmailParams = {
  to: string
  subject: string
  text: string
  html?: string
}

function requiredEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing server env var: ${name}`)
  return v
}

function getEnv(name: string) {
  return process.env[name]
}

/**
 * Send email using Resend API (recommended - easier setup)
 * Requires: RESEND_API_KEY environment variable
 */
async function sendEmailResend(params: SendEmailParams) {
  const apiKey = getEnv('RESEND_API_KEY')
  if (!apiKey) {
    throw new Error('Missing server env var: RESEND_API_KEY')
  }

  const from =
    getEnv('RESEND_FROM_EMAIL') ||
    getEnv('SMTP_FROM') ||
    'noreply@yourdomain.com' // Update this to your verified domain

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    const errorMsg = error.message || response.statusText
    // Log full error for debugging
    console.error('Resend API error details:', {
      status: response.status,
      statusText: response.statusText,
      error: error,
      from: from,
    })
    // Provide helpful message for domain verification issues
    if (errorMsg.includes('domain is not verified') || errorMsg.includes('not verified') || errorMsg.includes('Domain')) {
      throw new Error(
        `Resend domain not verified: ${errorMsg}. Use onboarding@resend.dev for testing, or verify your domain at https://resend.com/domains`
      )
    }
    throw new Error(`Resend API error: ${errorMsg}`)
  }

  const data = await response.json()
  return { messageId: data.id }
}

/**
 * Send email using SMTP (works with Gmail, SendGrid, Mailgun, etc.)
 * Requires: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables
 */
async function sendEmailViaSmtp(params: SendEmailParams) {
  const host = requiredEnv('SMTP_HOST')
  const port = Number(requiredEnv('SMTP_PORT'))
  const user = requiredEnv('SMTP_USER')
  const pass = requiredEnv('SMTP_PASS')

  const secure =
    process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465

  const from =
    process.env.SMTP_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    'noreply.servicehub@wabanakisoftwaresolutions.com'

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  const info = await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    ...(params.html ? { html: params.html } : {}),
  })

  return { messageId: info.messageId }
}

/**
 * Main email sending function - tries Resend first, then falls back to SMTP
 */
export async function sendEmailSmtp(params: SendEmailParams) {
  // Try Resend first (easier setup)
  const resendKey = getEnv('RESEND_API_KEY')
  if (resendKey) {
    try {
      return await sendEmailResend(params)
    } catch (error: any) {
      const errorMsg = error?.message || ''
      // If domain not verified, provide helpful guidance
      if (errorMsg.includes('domain is not verified') || errorMsg.includes('not verified')) {
        console.warn('Resend domain not verified. For testing, use onboarding@resend.dev or verify your domain.')
        // Try SMTP fallback if configured
        const smtpHost = getEnv('SMTP_HOST')
        if (smtpHost) {
          console.warn('Falling back to SMTP...')
          return await sendEmailViaSmtp(params)
        }
        // If no SMTP fallback, throw with helpful message
        throw new Error(
          'Resend domain not verified. Options: 1) Use onboarding@resend.dev for testing, 2) Verify domain at https://resend.com/domains, or 3) Configure SMTP as fallback.'
        )
      }
      console.warn('Resend failed, trying SMTP:', errorMsg)
      // Fall through to SMTP for other errors
    }
  }

  // Try SMTP
  const smtpHost = getEnv('SMTP_HOST')
  if (!smtpHost) {
    console.error(
      'No email provider configured. Please set either RESEND_API_KEY or SMTP_HOST. See EMAIL_SETUP.md for instructions.'
    )
    throw new Error('Missing server env var: RESEND_API_KEY or SMTP_HOST')
  }

  return await sendEmailViaSmtp(params)
}



