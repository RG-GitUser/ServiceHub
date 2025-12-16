'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

function VerifyEmailInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyEmail } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>('idle')
  const [message, setMessage] = useState('')

  const handleVerification = useCallback(async (userId: string, secret: string) => {
    setStatus('verifying')
    setMessage('Verifying your email address...')

    try {
      const result = await verifyEmail(userId, secret)

      if (result.success) {
        setStatus('success')
        setMessage('Email verified successfully! You can now sign in.')
        // Redirect to sign in after 2 seconds (faster)
        setTimeout(() => {
          window.location.href = '/signin'
        }, 2000)
      } else {
        setStatus('error')
        setMessage(result.error || 'Failed to verify email. The link may have expired.')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Failed to verify email. Please try again.')
      console.error('Verification error:', error)
    }
  }, [verifyEmail])

  useEffect(() => {
    // Check query parameters first
    let userId = searchParams.get('userId')
    let secret = searchParams.get('secret')

    // If not in query params, check URL hash (Appwrite sometimes uses fragments)
    if (!userId || !secret) {
      const hash = window.location.hash.substring(1)
      if (hash) {
        const hashParams = new URLSearchParams(hash)
        userId = userId || hashParams.get('userId') || ''
        secret = secret || hashParams.get('secret') || ''
      }
    }

    // Also check full URL for Appwrite format
    if (!userId || !secret) {
      try {
        const fullUrl = window.location.href
        const urlParams = new URL(fullUrl)
        userId = userId || urlParams.searchParams.get('userId') || ''
        secret = secret || urlParams.searchParams.get('secret') || ''
      } catch (e) {
        // URL parsing failed, continue with what we have
      }
    }

    if (userId && secret) {
      handleVerification(userId, secret)
    } else {
      setStatus('error')
      setMessage('Invalid verification link. Please check your email and try again.')
      console.log('Verification URL params:', { 
        userId, 
        secret, 
        searchParams: Object.fromEntries(searchParams.entries()), 
        hash: window.location.hash, 
        href: window.location.href 
      })
    }
  }, [searchParams, handleVerification])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                ServiceHub
              </h1>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
          </div>

          {status === 'verifying' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-700">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="inline-block mb-4">
                <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700 mb-4">{message}</p>
              <p className="text-sm text-gray-500 mb-4">Redirecting to sign in...</p>
              <Link
                href="/signin"
                className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Go to Sign In Now
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {message}
              </div>

              <div className="text-center space-y-4">
                <p className="text-gray-700">
                  If your verification link expired, you can request a new one by signing in.
                </p>
                <Link
                  href="/signin"
                  className="inline-block w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Sign In
                </Link>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <div className="text-center py-8">
              <p className="text-gray-700 mb-4">Waiting for verification...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  )
}

