import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { CookieBanner } from '@/components/CookieBanner'

export const metadata: Metadata = {
  title: 'ServiceHub - Book Services & Browse Products',
  description: 'Modern platform for booking services and browsing products',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">
        <AuthProvider>
          <CartProvider>
            {children}
            <CookieBanner />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

