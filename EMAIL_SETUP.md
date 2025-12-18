# Email Setup Guide

This guide will help you set up email sending for booking and order confirmations.

## Quick Setup Options

You have **two options** for sending emails:

### Option 1: Resend (Recommended - Easiest) ⭐

Resend is a modern email API that's very easy to set up:

1. **Sign up for Resend** (free tier available):
   - Go to [resend.com](https://resend.com)
   - Sign up for a free account
   - Verify your email

2. **Get your API Key**:
   - Go to **API Keys** in your Resend dashboard
   - Click **Create API Key**
   - Copy the API key

3. **Add to `.env.local`**:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
   
   **Note:** For the free tier, you can use `onboarding@resend.dev` as the from email for testing, but you'll need to verify your domain for production.

4. **Restart your dev server**:
   ```bash
   npm run dev
   ```

That's it! Resend is now configured.

---

### Option 2: SMTP (Gmail, SendGrid, Mailgun, etc.)

If you prefer to use SMTP directly:

#### Using Gmail (Free, Good for Development)

1. **Enable App Password**:
   - Go to your Google Account settings
   - Enable 2-Step Verification
   - Go to **App Passwords**
   - Generate an app password for "Mail"

2. **Add to `.env.local`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password-here
   SMTP_FROM=your-email@gmail.com
   ```

#### Using SendGrid (Production-Ready)

1. **Sign up for SendGrid**:
   - Go to [sendgrid.com](https://sendgrid.com)
   - Create a free account
   - Verify your sender email

2. **Get SMTP credentials**:
   - Go to **Settings** → **API Keys**
   - Create an API key with "Mail Send" permissions
   - Or use SMTP: **Settings** → **Sender Authentication** → **SMTP Relay**

3. **Add to `.env.local`**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM=your-verified-email@yourdomain.com
   ```

#### Using Mailgun (Production-Ready)

1. **Sign up for Mailgun**:
   - Go to [mailgun.com](https://mailgun.com)
   - Create an account
   - Verify your domain

2. **Get SMTP credentials**:
   - Go to **Sending** → **Domain Settings** → **SMTP credentials**

3. **Add to `.env.local`**:
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=postmaster@your-domain.mailgun.org
   SMTP_PASS=your-mailgun-password
   SMTP_FROM=noreply@yourdomain.com
   ```

---

## Testing Your Email Setup

After configuring your email provider:

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Create a test booking**:
   - Go to the Services page
   - Book a service
   - Check your email inbox for the confirmation

3. **Check the console**:
   - If emails aren't sending, check the terminal/console for error messages
   - Common issues:
     - Missing environment variables
     - Invalid API keys/passwords
     - Unverified sender email/domain

---

## Troubleshooting

### "Missing server env var: RESEND_API_KEY or SMTP_HOST"
- Make sure you've added the environment variables to `.env.local`
- **Important:** Restart your dev server after adding/changing `.env.local`
- Variables must NOT have `NEXT_PUBLIC_` prefix (these are server-only)

### "Email not configured" error
- Check that your `.env.local` file is in the `ServiceHub/` directory
- Verify the variable names are correct (case-sensitive)
- Make sure there are no extra spaces or quotes around values

### Gmail "Less secure app" error
- Use an **App Password** instead of your regular Gmail password
- Enable 2-Step Verification first, then generate an app password

### Resend "Domain not verified" error
- For testing: Use `onboarding@resend.dev` as the from email
- For production: Verify your domain in Resend dashboard

---

## Production Considerations

- **Verify your sender domain** to improve deliverability
- **Use a dedicated email service** (Resend, SendGrid, Mailgun) instead of Gmail for production
- **Set up SPF/DKIM records** for your domain
- **Monitor email delivery** through your provider's dashboard

---

## Need Help?

- **Resend Docs**: https://resend.com/docs
- **SendGrid Docs**: https://docs.sendgrid.com
- **Mailgun Docs**: https://documentation.mailgun.com
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833

