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

export async function sendEmailSmtp(params: SendEmailParams) {
  const host = requiredEnv('SMTP_HOST')
  const port = Number(requiredEnv('SMTP_PORT'))
  const user = requiredEnv('SMTP_USER')
  const pass = requiredEnv('SMTP_PASS')

  const secure =
    process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465

  const from =
    process.env.SMTP_FROM ||
    process.env.RESEND_FROM_EMAIL || // backward-compat if you already set it
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



