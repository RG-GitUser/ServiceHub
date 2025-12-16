import { NextResponse } from 'next/server'
import { sendEmailSmtp } from '@/lib/server/email'

type OrderConfirmationBody = {
  to: string
  userName?: string
  purchases: Array<{ item: string; purchaseType: string; quantity: number; unitPrice: number }>
  subtotal: number
  total: number
  purchaseDateIso: string
}

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OrderConfirmationBody

    if (!body?.to) {
      return NextResponse.json({ ok: false, error: 'Missing "to" email' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'noreply.servicehub@wabanakisoftwaresolutions.com'

    // Resend is no longer required; we send via SMTP (Namecrane).
    // (Keeping these vars read here only to avoid breaking older setups using RESEND_FROM_EMAIL as the from address.)
    void resendKey
    void fromEmail

    const lines = body.purchases
      .map(
        (p) =>
          `- ${p.item} (${p.purchaseType}) x${p.quantity} — ${formatMoney(p.unitPrice)} each`
      )
      .join('\n')

    const subject = 'Order confirmation (test mode)'
    const greetingName = body.userName ? ` ${body.userName}` : ''
    const text = `Hi${greetingName},

Thanks for your order! (This is a TEST — no real payment was processed.)

Order date: ${new Date(body.purchaseDateIso).toLocaleString()}

Items:
${lines}

Subtotal: ${formatMoney(body.subtotal)}
Total: ${formatMoney(body.total)}

— ServiceHub`

    const htmlLines = body.purchases
      .map(
        (p) =>
          `<li><strong>${p.item}</strong> (${p.purchaseType}) × ${p.quantity} — ${formatMoney(
            p.unitPrice
          )} each</li>`
      )
      .join('')

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5;">
        <p>Hi${greetingName},</p>
        <p><strong>Thanks for your order!</strong> (This is a <strong>TEST</strong> — no real payment was processed.)</p>
        <p><strong>Order date:</strong> ${new Date(body.purchaseDateIso).toLocaleString()}</p>
        <p><strong>Items:</strong></p>
        <ul>${htmlLines}</ul>
        <p><strong>Subtotal:</strong> ${formatMoney(body.subtotal)}<br/>
        <strong>Total:</strong> ${formatMoney(body.total)}</p>
        <p>— ServiceHub</p>
      </div>
    `

    const info = await sendEmailSmtp({ to: body.to, subject, text, html })
    return NextResponse.json({ ok: true, id: info.messageId })
  } catch (e: any) {
    console.error('order-confirmation email error:', e)
    const msg = e?.message || 'Unknown error'
    const status = msg.startsWith('Missing server env var:') ? 501 : 500
    return NextResponse.json({ ok: false, error: msg }, { status })
  }
}


