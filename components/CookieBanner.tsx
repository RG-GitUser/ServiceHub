'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'servicehub_cookie_consent_v1'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY)
      if (!existing) setVisible(true)
    } catch {
      // If storage is blocked, still show banner.
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-4">
      <div className="mx-auto max-w-5xl rounded-2xl bg-primary-600 shadow-xl px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-white">
            <div className="flex items-center gap-2 font-semibold">
              <svg
                className="w-5 h-5 text-white/95"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2a10 10 0 1 0 10 10" />
                <path d="M22 12a4 4 0 0 1-4 4" />
                <path d="M9.5 8.5h.01" />
                <path d="M14.5 11.5h.01" />
                <path d="M8.5 13.5h.01" />
                <path d="M12.5 16.5h.01" />
              </svg>
              Cookies
            </div>
            <div className="mt-1 text-white/90">
              We use cookies/local storage to keep you signed in, remember your cart, and improve your experience.
              {' '}
              <Link href="/cookies" className="text-white font-semibold underline underline-offset-4 hover:text-white/90">
                Learn more
              </Link>
              .
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/cookies"
              className="h-11 px-4 rounded-lg border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              Details
            </Link>
            <button
              type="button"
              onClick={accept}
              className="h-11 px-5 rounded-lg bg-white text-primary-700 font-semibold hover:bg-white/90 transition-colors flex items-center justify-center"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


