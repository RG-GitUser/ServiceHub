'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Booking {
  $id: string
  serviceName: string
  serviceDescription: string
  servicePrice: number
  serviceDuration: string
  bookingDate: string
  bookingTime: string
  userId: string
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, updateProfile, getBookings } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    } else if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      // Load bookings
      if (getBookings) {
        loadBookings()
      }
    }
  }, [user, loading, router])

  const loadBookings = async () => {
    if (getBookings) {
      setBookingsLoading(true)
      try {
        const userBookings = await getBookings()
        setBookings(userBookings)
      } catch (error) {
        console.error('Failed to load bookings:', error)
      } finally {
        setBookingsLoading(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    if (updateProfile) {
      const result = await updateProfile(name, email)
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setIsEditing(false)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' })
      }
    }
    
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  ServiceHub
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/products"
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/services"
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Book Services
              </Link>
              <Link
                href="/profile"
                className="text-primary-600 font-semibold px-4 py-2 rounded-lg bg-primary-50 transition-colors"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-black"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-black bg-gray-50"
                  placeholder="Enter your email"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setName(user.name || '')
                    setEmail(user.email || '')
                    setMessage(null)
                  }}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-600">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                  <p className="text-lg text-gray-900">{user.name || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                  <p className="text-lg text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                  <p className="text-sm text-gray-600 font-mono">{user.$id}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
