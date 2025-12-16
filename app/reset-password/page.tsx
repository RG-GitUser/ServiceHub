'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { account } from '@/lib/appwrite'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)

  useEffect(() => {
    const userIdParam = searchParams.get('userId')
    const secretParam = searchParams.get('secret')
    
    if (userIdParam && secretParam) {
      setUserId(userIdParam)
      setSecret(secretParam)
    } else {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!userId || !secret) {
      setError('Invalid reset link')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await account.updateRecovery(userId, secret, data.password)
      setSuccess(true)
      
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.push('/signin')
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <h2 className="text-2xl font-bold text-black">Reset Password</h2>
            <p className="text-black mt-2">Enter your new password</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Password Reset Successful</h3>
                <p className="text-black">
                  Your password has been reset. Redirecting to sign in...
                </p>
              </div>
              <Link
                href="/signin"
                className="inline-block w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                  New Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-black"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                  Confirm New Password
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  id="confirmPassword"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-black"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !userId || !secret}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/signin"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  )
}

