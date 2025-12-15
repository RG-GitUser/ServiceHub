'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { client, account, databases, ID } from '@/lib/appwrite'

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
  createBooking: (serviceName: string, serviceDescription: string, servicePrice: number, serviceDuration: number, bookingDate: string, bookingTime: string, consentForm: boolean, city?: string, age?: number) => Promise<{ success: boolean; error?: string }>
  getBookings: () => Promise<Booking[]>
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
      
      if (databaseId) {
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

      console.log('Creating appointment with user credentials:', {
        databaseId,
        collectionId: appointmentsCollectionId,
        userName: session.name || user.name,
        userEmail: session.email || user.email,
        userId: user.$id,
        bookingDateTime
      })

      await databases.createDocument(
        databaseId,
        appointmentsCollectionId,
        ID.unique(),
        {
          // User credentials in Appointments table (lowercase to match schema)
          name: session.name || user.name || '',
          email: session.email || user.email,
          city: city || null,
          age: age ? parseInt(age.toString()) : null,
          // Appointment details
          serviceName,
          serviceDescription: serviceDescription || '',
          servicePrice,
          serviceDuration, // Integer (duration in minutes)
          bookingDate: bookingDateTime, // Datetime format (ISO string)
          bookingTime,
          consentForm, // Required boolean
        }
      )

      console.log('Appointment created successfully')
      return { success: true }
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

      // Query appointments for this user
      const response = await databases.listDocuments(
        databaseId,
        appointmentsCollectionId,
        [
          `equal("userId", "${user.$id}")`
        ]
      )

      return response.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
        email: doc.email,
        city: doc.city,
        age: doc.age,
        serviceName: doc.serviceName,
        serviceDescription: doc.serviceDescription,
        servicePrice: doc.servicePrice,
        serviceDuration: doc.serviceDuration,
        bookingDate: doc.bookingDate,
        bookingTime: doc.bookingTime,
        consentForm: doc.consentForm,
        userId: doc.userId,
        createdAt: doc.createdAt,
      }))
    } catch (error: any) {
      console.error('Get bookings error:', error)
      return []
    }
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signInWithGoogle, signInWithFacebook, signOut, resetPassword, verifyEmail, resendVerification, updateProfile, createBooking, getBookings, loading }}>
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

