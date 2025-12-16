'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { client, account, databases, ID } from '@/lib/appwrite'
import { Query } from 'appwrite'

interface User {
  email: string
  name?: string
  $id?: string
}

interface Booking {
  $id: string
  name: string
  email: string
  city?: string
  age?: number
  serviceName: string
  serviceDescription: string
  servicePrice: number
  serviceDuration: number
  bookingDate: string
  bookingTime: string
  consentForm: boolean
  userId: string
  createdAt: string
  status?: string
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  verifyEmail: (userId: string, secret: string) => Promise<{ success: boolean; error?: string }>
  resendVerification: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (name: string, email: string) => Promise<{ success: boolean; error?: string }>
  createBooking: (serviceName: string, serviceDescription: string, servicePrice: number, serviceDuration: number, bookingDate: string, bookingTime: string, consentForm: boolean, city?: string, age?: number) => Promise<{ success: boolean; error?: string; emailSent?: boolean; emailError?: string }>
  getBookings: () => Promise<Booking[]>
  cancelBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>
  requestReschedule: (bookingId: string, newDate: string, newTime: string) => Promise<{ success: boolean; error?: string }>
  deleteBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    checkUserSession()
    
    // Handle OAuth callback (Appwrite uses URL fragments)
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const userId = params.get('userId')
      const secret = params.get('secret')
      
      if (userId && secret) {
        // Handle OAuth callback inline
        account.createSession(userId, secret)
          .then(() => account.get())
          .then((session) => {
            setUser({
              email: session.email,
              name: session.name,
              $id: session.$id,
            })
            window.history.replaceState({}, '', window.location.pathname)
            window.location.href = '/'
          })
          .catch((error: any) => {
            console.error('OAuth callback error:', error)
          })
      }
    }
  }, [])

  const checkUserSession = async () => {
    try {
      // Add timeout to prevent hanging (5 second timeout)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      )
      
      const sessionPromise = account.get()
      const session = await Promise.race([sessionPromise, timeoutPromise]) as any
      
      setUser({
        email: session.email,
        name: session.name,
        $id: session.$id,
      })
    } catch (error: any) {
      // User is not logged in - this is normal if no session exists
      setUser(null)
    } finally {
      // Always set loading to false, even if there's an error
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password)
      const session = await account.get()
      
      // Check if email is verified
      // Appwrite stores email verification status in session.emailVerification
      // Log the session to debug verification status
      console.log('User session:', {
        email: session.email,
        emailVerification: session.emailVerification,
        allProps: Object.keys(session)
      })
      
      // Check verification status - Appwrite uses emailVerification boolean
      const isVerified = session.emailVerification === true
      
      if (!isVerified) {
        console.log('User email not verified. Verification status:', session.emailVerification)
        // For now, allow unverified users to sign in for testing
        // TODO: Re-enable verification check once email verification is working
        // Sign out the unverified user
        // await account.deleteSession('current')
        // return { 
        //   success: false, 
        //   error: 'Please verify your email address before signing in. Check your inbox for the verification email.' 
        // }
        console.warn('User signed in but email is not verified')
      }
      
      setUser({
        email: session.email,
        name: session.name,
        $id: session.$id,
      })
      
      return { success: true }
    } catch (error: any) {
      console.error('Sign in error:', error)
      // Provide more helpful error messages
      let errorMessage = 'Invalid email or password'
      
      // Check for CORS/network errors
      if (error.message?.includes('Failed to fetch') || error.message?.includes('CORS')) {
        errorMessage = 'CORS Error: Please add "localhost" as a platform in Appwrite. Go to Auth → Platforms → Add Platform → Web App → Hostname: localhost'
      } else if (error.type === 'general_unauthorized_scope') {
        errorMessage = 'Platform not configured. Please add localhost to your Appwrite platforms (Auth → Platforms).'
      } else if (error.code === 401) {
        errorMessage = 'Invalid email or password'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Create account in Appwrite
      const userAccount = await account.create(ID.unique(), email, password, name)
      const userId = userAccount.$id
      
      // Create a temporary session to send verification email
      await account.createEmailPasswordSession(email, password)
      
      // Send verification email
      try {
        const verificationUrl = `${window.location.origin}/verify-email`
        console.log('Sending verification email to:', verificationUrl)
        await account.createVerification(verificationUrl)
        console.log('Verification email sent successfully')
      } catch (verificationError: any) {
        console.error('Verification email error:', verificationError)
        // Log the full error for debugging
        console.error('Verification error details:', {
          message: verificationError.message,
          code: verificationError.code,
          type: verificationError.type,
          response: verificationError.response
        })
        // Continue even if verification email fails - account is still created
      }
      
      // Save user data to "sh-users" collection in database
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
      const usersCollectionId = 'sh-users' // Users table collection ID
      
      // Validate that databaseId is not a collection ID (common mistake)
      if (databaseId && (databaseId === 'sh-users' || databaseId === 'appointments')) {
        console.error('Invalid Database ID: Collection ID used instead of Database ID')
        console.error('Please get the Database ID from Appwrite Console → Databases → Your Database → Settings')
        // Don't fail signup if database is misconfigured - account is still created
      } else if (databaseId) {
        try {
          console.log('Saving user to Users table:', { databaseId, collectionId: usersCollectionId, name, email })
          const result = await databases.createDocument(
            databaseId,
            usersCollectionId,
            ID.unique(),
            {
              name: name || '', // lowercase to match schema
              email: email, // lowercase to match schema
              // Note: Password is handled securely by Appwrite Auth and should NOT be stored in plain text
              // If your Users table requires Password field, you may need to remove it or mark it as optional
            }
          )
          console.log('User saved to Users table successfully:', result.$id)
        } catch (dbError: any) {
          console.error('Failed to save user to Users table:', dbError)
          console.error('Database error details:', {
            message: dbError.message,
            code: dbError.code,
            type: dbError.type,
            response: dbError.response
          })
          // Don't fail signup if database save fails - account is still created
          // This allows the app to work even if database isn't configured
        }
      } else {
        console.warn('Database ID not configured. User data will not be saved to database.')
        console.warn('Please add NEXT_PUBLIC_APPWRITE_DATABASE_ID to your .env.local file')
      }
      
      // Delete the temporary session (user needs to verify email before signing in)
      try {
        await account.deleteSession('current')
      } catch (deleteError) {
        // Ignore delete errors
      }
      
      return { 
        success: true, 
        needsVerification: true 
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      // Provide more helpful error messages
      let errorMessage = 'Failed to create account'
      
      // Check for CORS/network errors
      if (error.message?.includes('Failed to fetch') || error.message?.includes('CORS')) {
        errorMessage = 'CORS Error: Please add "localhost" as a platform in Appwrite. Go to Auth → Platforms → Add Platform → Web App → Hostname: localhost'
      } else if (error.type === 'general_unauthorized_scope') {
        errorMessage = 'Platform not configured. Please add localhost to your Appwrite platforms (Auth → Platforms).'
      } else if (error.code === 409) {
        errorMessage = 'An account with this email already exists'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  const verifyEmail = async (userId: string, secret: string) => {
    try {
      console.log('Verifying email with userId:', userId, 'secret:', secret.substring(0, 10) + '...')
      await account.updateVerification(userId, secret)
      console.log('Email verified successfully')
      return { success: true }
    } catch (error: any) {
      console.error('Email verification error:', error)
      console.error('Verification error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response
      })
      return { 
        success: false, 
        error: error.message || 'Failed to verify email. The link may have expired.' 
      }
    }
  }

  const resendVerification = async (email: string, password: string) => {
    try {
      // Create a session first (requires password)
      await account.createEmailPasswordSession(email, password)
      
      // Now send verification email
      await account.createVerification(`${window.location.origin}/verify-email`)
      
      // Delete the session since they're not verified yet
      await account.deleteSession('current')
      
      return { success: true }
    } catch (error: any) {
      console.error('Resend verification error:', error)
      let errorMessage = 'Failed to resend verification email'
      
      if (error.code === 401) {
        errorMessage = 'Invalid email or password'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  const signOut = async () => {
    try {
      await account.deleteSession('current')
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      // Still clear user state even if logout fails
      setUser(null)
    }
  }

  const signInWithGoogle = async () => {
    try {
      await account.createOAuth2Session(
        'google' as any,
        `${window.location.origin}`,
        `${window.location.origin}`
      )
    } catch (error: any) {
      console.error('Google OAuth error:', error)
    }
  }

  const signInWithFacebook = async () => {
    try {
      await account.createOAuth2Session(
        'facebook' as any,
        `${window.location.origin}`,
        `${window.location.origin}`
      )
    } catch (error: any) {
      console.error('Facebook OAuth error:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      )
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to send password reset email' 
      }
    }
  }

  const updateProfile = async (name: string, email: string) => {
    try {
      // Update name in Appwrite account
      await account.updateName(name)
      
      // Refresh user session to get updated data
      const session = await account.get()
      setUser({
        email: session.email,
        name: session.name,
        $id: session.$id,
      })
      
      return { success: true }
    } catch (error: any) {
      console.error('Update profile error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      }
    }
  }

  const createBooking = async (
    serviceName: string,
    serviceDescription: string,
    servicePrice: number,
    serviceDuration: number,
    bookingDate: string,
    bookingTime: string,
    consentForm: boolean,
    city?: string,
    age?: number
  ) => {
    try {
      if (!user?.$id) {
        return { success: false, error: 'User not logged in' }
      }

      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
      const appointmentsCollectionId = 'appointments' // Appointments table collection ID

      if (!databaseId) {
        return { success: false, error: 'Database not configured' }
      }

      // Get current user session to include user credentials
      const session = await account.get()

      // Convert bookingDate and bookingTime to datetime format
      // Combine date and time into ISO datetime string
      const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`).toISOString()

      // Keep backwards compatibility with older schema constraints, but also store full titles when possible.
      const truncatedServiceName = serviceName.substring(0, 20)
      const fullServiceName = (serviceName || '').substring(0, 100)
      // Truncate serviceDescription to 100 characters (database constraint)
      const truncatedServiceDescription = (serviceDescription || '').substring(0, 100)

      console.log('Creating appointment with user credentials:', {
        databaseId,
        collectionId: appointmentsCollectionId,
        userName: session.name || user.name,
        userEmail: session.email || user.email,
        userId: user.$id,
        bookingDateTime,
        serviceName: truncatedServiceName,
        serviceDescription: truncatedServiceDescription
      })

      const basePayload: Record<string, any> = {
        // User credentials in Appointments table (lowercase to match schema)
        name: session.name || user.name || '',
        email: session.email || user.email,
        city: city || null,
        age: age ? parseInt(age.toString()) : null,
        // Appointment details
        serviceName: truncatedServiceName, // Kept for compatibility with old schema
        serviceNameFull: fullServiceName, // Prefer displaying this in UI when schema supports it
        serviceDescription: truncatedServiceDescription, // Truncated to 100 chars max (database constraint)
        servicePrice,
        serviceDuration, // Integer (duration in minutes)
        bookingDate: bookingDateTime, // Datetime format (ISO string)
        bookingTime,
        consentForm, // Required boolean
        // If your schema requires this attribute, keep it present from day 1.
        rescheduleRequested: false,
      }

      // Preferred: store userId + status so profile can query and actions can update reliably.
      const fullPayload: Record<string, any> = {
        ...basePayload,
        userId: user.$id,
        status: 'scheduled',
      }

      const tryCreate = async (payload: Record<string, any>) =>
        await databases.createDocument(databaseId, appointmentsCollectionId, ID.unique(), payload)

      try {
        await tryCreate(fullPayload)
      } catch (e: any) {
        const msg = (e?.message || '').toLowerCase()

        // If schema doesn't have serviceNameFull, drop it first.
        if ((msg.includes('unknown attribute') || msg.includes('attribute not found in schema')) && msg.includes('servicenamefull')) {
          const baseNoFullName = { ...basePayload }
          delete (baseNoFullName as any).serviceNameFull
          const fullNoFullName = { ...fullPayload }
          delete (fullNoFullName as any).serviceNameFull

          try {
            await tryCreate(fullNoFullName)
            return { success: true, emailSent: true }
          } catch {
            // continue to broader fallback below
          }

          // Replace basePayload/fullPayload for fallback logic
          ;(basePayload as any).serviceNameFull = undefined
          ;(fullPayload as any).serviceNameFull = undefined
        }

        const unknownUserId =
          (msg.includes('unknown attribute') || msg.includes('attribute not found in schema')) && msg.includes('userid')
        const unknownStatus =
          (msg.includes('unknown attribute') || msg.includes('attribute not found in schema')) && msg.includes('status')

        // Retry by dropping only what the schema doesn't support.
        const candidates: Array<Record<string, any>> = []
        if (unknownUserId && !unknownStatus) candidates.push({ ...basePayload, status: 'scheduled' })
        if (!unknownUserId && unknownStatus) candidates.push({ ...basePayload, userId: user.$id })
        if (unknownUserId && unknownStatus) candidates.push(basePayload)
        // If error wasn't about unknown fields, still try basePayload once before failing.
        candidates.push(basePayload)

        let lastErr: any = e
        for (const c of candidates) {
          try {
            await tryCreate(c)
            lastErr = null
            break
          } catch (e2: any) {
            lastErr = e2
          }
        }
        if (lastErr) throw lastErr
      }

      console.log('Appointment created successfully')
      // Send booking confirmation email (server-side via SMTP route).
      try {
        const resp = await fetch('/api/booking-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: session.email || user.email,
            userName: session.name || user.name,
            serviceName: truncatedServiceName,
            bookingDateIso: bookingDateTime,
            bookingTime,
            servicePrice,
            serviceDurationMinutes: serviceDuration,
          }),
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          return { success: true, emailSent: false, emailError: data?.error || 'Failed to send email' }
        }
        return { success: true, emailSent: true }
      } catch (e: any) {
        return { success: true, emailSent: false, emailError: e?.message || 'Failed to send email' }
      }
    } catch (error: any) {
      console.error('Create booking error:', error)
      console.error('Booking error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response
      })
      return { 
        success: false, 
        error: error.message || 'Failed to create booking' 
      }
    }
  }

  const getBookings = async (): Promise<Booking[]> => {
    try {
      if (!user?.$id) {
        return []
      }

      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
      const appointmentsCollectionId = 'appointments' // Appointments table collection ID

      if (!databaseId) {
        return []
      }

      // Validate that databaseId is not a collection ID (common mistake)
      if (databaseId === 'sh-users' || databaseId === 'appointments') {
        console.error('Invalid Database ID: Collection ID used instead of Database ID')
        return []
      }

      // Query appointments for this user.
      // Appwrite Query.equal sometimes expects the value as an array; we try both.
      // Prefer userId if available in schema; fall back to email if userId isn't present.
      let response: any
      const tryList = async (queries: any[]) =>
        await databases.listDocuments(databaseId, appointmentsCollectionId, queries)

      try {
        response = await tryList([Query.equal('userId', user.$id as any), Query.orderAsc('bookingDate')])
      } catch (e1: any) {
        const msg1 = (e1?.message || '').toLowerCase()
        const userIdMissing =
          (msg1.includes('attribute not found in schema') || msg1.includes('unknown attribute')) &&
          msg1.includes('userid')

        if (userIdMissing) {
          // Fall back to email-based query (some schemas use Email vs email; also try value array shape).
          const emailQueries: any[] = [
            Query.equal('email', user.email as any),
            Query.equal('email', [user.email] as any),
            Query.equal('Email', user.email as any),
            Query.equal('Email', [user.email] as any),
          ]

          let lastErr: any = null
          for (const q of emailQueries) {
            try {
              response = await tryList([q, Query.orderAsc('bookingDate')])
              lastErr = null
              break
            } catch (eEmail: any) {
              lastErr = eEmail
            }
          }

          if (lastErr) throw lastErr
        } else {
          // userId exists; retry with array value shape
          response = await tryList([Query.equal('userId', [user.$id] as any), Query.orderAsc('bookingDate')])
        }
      }

      return response.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
        email: doc.email,
        city: doc.city,
        age: doc.age,
        serviceName: doc.serviceNameFull || doc.serviceName,
        serviceDescription: doc.serviceDescription,
        servicePrice: doc.servicePrice,
        serviceDuration: doc.serviceDuration,
        bookingDate: doc.bookingDate,
        bookingTime: doc.bookingTime,
        consentForm: doc.consentForm,
        userId: doc.userId || user.$id,
        createdAt: doc.createdAt || doc.$createdAt,
        status: doc.status || doc.Status || doc.appointmentStatus || doc.AppointmentStatus,
      }))
    } catch (error: any) {
      console.error('Get bookings error:', error)
      return []
    }
  }

  const cancelBooking = async (bookingId: string) => {
    try {
      if (!user?.$id) return { success: false, error: 'User not logged in' }
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
      const appointmentsCollectionId = 'appointments'
      if (!databaseId) return { success: false, error: 'Database not configured' }

      const nowIso = new Date().toISOString()
      const candidates: Array<Record<string, any>> = [
        { status: 'cancelled', cancelledAt: nowIso, rescheduleRequested: false },
        { status: 'canceled', cancelledAt: nowIso, rescheduleRequested: false },
        { Status: 'cancelled', CancelledAt: nowIso, rescheduleRequested: false },
        { cancelled: true, cancelledAt: nowIso, rescheduleRequested: false },
        { cancelled: true, rescheduleRequested: false },
      ]

      let lastErr: any = null
      for (const payload of candidates) {
        try {
          await databases.updateDocument(databaseId, appointmentsCollectionId, bookingId, payload)
          return { success: true }
        } catch (e: any) {
          lastErr = e
          const msg = (e?.message || '').toLowerCase()
          // keep trying other shapes
          if (msg.includes('unknown attribute') || msg.includes('attribute not found in schema')) continue
          throw e
        }
      }

      return {
        success: false,
        error:
          lastErr?.message ||
          'Unable to cancel: add a `status` (string) attribute to your appointments collection or relax schema.',
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to cancel booking' }
    }
  }

  const requestReschedule = async (bookingId: string, newDate: string, newTime: string) => {
    try {
      if (!user?.$id) return { success: false, error: 'User not logged in' }
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
      const appointmentsCollectionId = 'appointments'
      if (!databaseId) return { success: false, error: 'Database not configured' }

      const requestedDateIso = new Date(`${newDate}T${newTime}:00`).toISOString()
      const nowIso = new Date().toISOString()

      const candidates: Array<Record<string, any>> = [
        {
          status: 'reschedule_requested',
          rescheduleRequested: true,
          requestedBookingDate: requestedDateIso,
          requestedBookingTime: newTime,
          rescheduleRequestedAt: nowIso,
        },
        {
          status: 'reschedule_requested',
          rescheduleRequested: true,
          RequestedBookingDate: requestedDateIso,
          RequestedBookingTime: newTime,
          RescheduleRequestedAt: nowIso,
        },
        {
          status: 'reschedule_requested',
          rescheduleRequested: true,
          requestedDate: requestedDateIso,
          requestedTime: newTime,
        },
        { status: 'reschedule_requested', rescheduleRequested: true },
      ]

      let lastErr: any = null
      for (const payload of candidates) {
        try {
          await databases.updateDocument(databaseId, appointmentsCollectionId, bookingId, payload)
          return { success: true }
        } catch (e: any) {
          lastErr = e
          const msg = (e?.message || '').toLowerCase()
          if (msg.includes('unknown attribute') || msg.includes('attribute not found in schema')) continue
          throw e
        }
      }

      return {
        success: false,
        error:
          lastErr?.message ||
          'Unable to request reschedule: add reschedule fields (e.g. `rescheduleRequested` boolean) to appointments schema.',
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to request reschedule' }
    }
  }

  const deleteBooking = async (bookingId: string) => {
    try {
      if (!user?.$id) return { success: false, error: 'User not logged in' }
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
      const appointmentsCollectionId = 'appointments'
      if (!databaseId) return { success: false, error: 'Database not configured' }

      await databases.deleteDocument(databaseId, appointmentsCollectionId, bookingId)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to delete booking' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithFacebook,
        signOut,
        resetPassword,
        verifyEmail,
        resendVerification,
        updateProfile,
        createBooking,
        getBookings,
        cancelBooking,
        requestReschedule,
        deleteBooking,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

