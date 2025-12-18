import { NextResponse } from 'next/server'
import { sendEmailSmtp } from '@/lib/server/email'

type BookingConfirmationBody = {
  to: string
  userName?: string
  serviceName: string
  bookingDateIso: string
  bookingTime: string
  servicePrice: number
  serviceDurationMinutes: number
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BookingConfirmationBody

    if (!body?.to) return NextResponse.json({ ok: false, error: 'Missing "to" email' }, { status: 400 })
    if (!body?.serviceName) {
      return NextResponse.json({ ok: false, error: 'Missing "serviceName"' }, { status: 400 })
    }

    const greetingName = body.userName ? ` ${body.userName}` : ''
    const subject = 'Booking confirmation'
    const text = `Hi${greetingName},

Your booking is confirmed:

Service: ${body.serviceName}
Date: ${new Date(body.bookingDateIso).toLocaleDateString()}
Time: ${body.bookingTime}
Duration: ${body.serviceDurationMinutes} minutes
Price: $${Number(body.servicePrice || 0).toFixed(2)}

— ServiceHub`

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5;">
        <p>Hi${greetingName},</p>
        <p><strong>Your booking is confirmed:</strong></p>
        <ul>
          <li><strong>Service:</strong> ${body.serviceName}</li>
          <li><strong>Date:</strong> ${new Date(body.bookingDateIso).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${body.bookingTime}</li>
          <li><strong>Duration:</strong> ${body.serviceDurationMinutes} minutes</li>
          <li><strong>Price:</strong> $${Number(body.servicePrice || 0).toFixed(2)}</li>
        </ul>
        <p>— ServiceHub</p>
      </div>
    `

    const info = await sendEmailSmtp({ to: body.to, subject, text, html })
    return NextResponse.json({ ok: true, id: info.messageId })
  } catch (e: any) {
    const msg = e?.message || 'Unknown error'
    // Handle email configuration errors gracefully
    if (msg.startsWith('Missing server env var: SMTP') || msg.startsWith('Missing server env var: RESEND')) {
      console.warn('Email not configured. Email sending skipped:', msg)
      return NextResponse.json({ 
        ok: false, 
        error: 'Email not configured. Booking was saved successfully.' 
      }, { status: 501 })
    }
    // Handle Resend domain verification errors
    if (msg.includes('domain is not verified') || msg.includes('not verified')) {
      console.warn('Resend domain not verified:', msg)
      return NextResponse.json({ 
        ok: false, 
        error: 'Email domain not verified. Use onboarding@resend.dev for testing or verify your domain. Booking was saved successfully.' 
      }, { status: 501 })
    }
    console.error('booking-confirmation email error:', e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}


