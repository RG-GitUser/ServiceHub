'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { Modal } from '@/components/Modal'

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

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, updateProfile, getBookings, cancelBooking, requestReschedule, deleteBooking, signOut } = useAuth()
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [actionOpen, setActionOpen] = useState(false)
  const [actionType, setActionType] = useState<'cancel' | 'delete' | 'reschedule' | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')

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
  }, [user, loading, router, getBookings])

  const loadBookings = async () => {
    if (getBookings) {
      setBookingsLoading(true)
      try {
        const userBookings = await getBookings()
        setBookings(userBookings)

        const now = new Date()
        const upcoming = userBookings
          .filter((b) => {
            const d = new Date(b.bookingDate)
            // Treat "today" bookings as upcoming even if timezone parsing is odd:
            // show anything from the last 12 hours forward.
            const twelveHoursMs = 12 * 60 * 60 * 1000
            return !Number.isNaN(d.getTime()) && d.getTime() >= now.getTime() - twelveHoursMs
          })
          .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime())
        setUpcomingBookings(upcoming)
      } catch (error) {
        console.error('Failed to load bookings:', error)
      } finally {
        setBookingsLoading(false)
      }
    }
  }

  const openAction = (type: 'cancel' | 'delete' | 'reschedule', booking: Booking) => {
    setActionError(null)
    setActionSuccess(null)
    setActionType(type)
    setSelectedBooking(booking)
    if (type === 'reschedule') {
      try {
        setRescheduleDate(new Date(booking.bookingDate).toISOString().slice(0, 10))
      } catch {
        setRescheduleDate('')
      }
      setRescheduleTime(booking.bookingTime || '')
    }
    setActionOpen(true)
  }

  const closeAction = () => {
    if (actionLoading) return
    setActionOpen(false)
    setActionType(null)
    setSelectedBooking(null)
    setActionError(null)
    setActionSuccess(null)
  }

  const confirmAction = async () => {
    if (!selectedBooking || !actionType) return
    setActionLoading(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      if (actionType === 'cancel') {
        const r = await cancelBooking(selectedBooking.$id)
        if (!r.success) throw new Error(r.error || 'Failed to cancel')
        setActionSuccess('Appointment cancelled.')
      } else if (actionType === 'delete') {
        const r = await deleteBooking(selectedBooking.$id)
        if (!r.success) throw new Error(r.error || 'Failed to delete')
        setActionSuccess('Appointment deleted.')
      } else if (actionType === 'reschedule') {
        if (!rescheduleDate || !rescheduleTime) {
          throw new Error('Please choose a new date and time.')
        }
        const r = await requestReschedule(selectedBooking.$id, rescheduleDate, rescheduleTime)
        if (!r.success) throw new Error(r.error || 'Failed to request reschedule')
        setActionSuccess('Reschedule request submitted.')
      }

      await loadBookings()
    } catch (e: any) {
      setActionError(e?.message || 'Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    // Convert 24-hour format to 12-hour format
    try {
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return timeString
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''}`
    }
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
          <div className="flex items-center h-16">
            <div className="flex-1 flex items-center">
              <Link href="/" className="flex items-center -ml-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  ServiceHub
                </h1>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center space-x-4">
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
            </div>

            <div className="flex-1 flex items-center justify-end space-x-4 -mr-2">
              <div className="flex items-center space-x-2 md:hidden">
                <Link
                  href="/products"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Products
                </Link>
                <Link
                  href="/services"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Services
                </Link>
              </div>

              <Link
                href="/profile"
                className="text-primary-600 font-semibold px-4 py-2 rounded-lg bg-primary-50 transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/cart"
                className="relative text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              <span className="hidden lg:inline text-gray-600">Welcome, {user.name || user.email}</span>
              <button
                onClick={signOut}
                className="bg-primary-600 text-white h-11 px-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center font-semibold"
              >
                Sign Out
              </button>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

              {/* Upcoming Appointments Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h3>
                
                {bookingsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="mt-2 text-gray-600">Loading appointments...</p>
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600">No upcoming appointments</p>
                    <Link
                      href="/services"
                      className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Book a Service →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.$id}
                        className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h4>
                            <p className="text-sm text-gray-600 mt-1">{booking.serviceDescription}</p>
                          </div>
                          <span className="text-lg font-bold text-primary-600">${booking.servicePrice}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <p className="text-gray-900 font-medium">{formatDate(booking.bookingDate)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Time:</span>
                            <p className="text-gray-900 font-medium">{formatTime(booking.bookingTime)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <p className="text-gray-900 font-medium">{formatDuration(booking.serviceDuration)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Booked:</span>
                            <p className="text-gray-900 font-medium">{formatDate(booking.createdAt)}</p>
                          </div>
                        </div>
                        {(booking.city || booking.age) && (
                          <div className="pt-3 border-t border-gray-200 text-sm">
                            {booking.city && <span className="text-gray-600">City: <strong>{booking.city}</strong></span>}
                            {booking.city && booking.age && <span className="mx-2">•</span>}
                            {booking.age && <span className="text-gray-600">Age: <strong>{booking.age}</strong></span>}
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                          <button
                            type="button"
                            onClick={() => openAction('reschedule', booking)}
                            className="h-11 px-4 rounded-lg border border-primary-200 text-primary-700 font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center"
                          >
                            Request Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => openAction('cancel', booking)}
                            className="h-11 px-4 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => openAction('delete', booking)}
                            className="h-11 px-4 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal
        open={actionOpen}
        onClose={closeAction}
        title={
          actionType === 'cancel'
            ? 'Cancel appointment'
            : actionType === 'delete'
              ? 'Delete appointment'
              : 'Request reschedule'
        }
        description={
          actionType === 'delete'
            ? 'This permanently removes the appointment.'
            : actionType === 'cancel'
              ? 'This will mark the appointment as cancelled (if your schema supports it).'
              : 'Choose a new date/time and we’ll store your request.'
        }
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex gap-4">
            <button
              type="button"
              onClick={closeAction}
              disabled={actionLoading}
              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Close
            </button>
            <button
              type="button"
              onClick={confirmAction}
              disabled={actionLoading || (actionType === 'reschedule' && (!rescheduleDate || !rescheduleTime))}
              className={`flex-1 h-12 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                actionType === 'delete' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {actionLoading
                ? 'Working…'
                : actionType === 'delete'
                  ? 'Delete'
                  : actionType === 'cancel'
                    ? 'Cancel appointment'
                    : 'Submit request'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedBooking && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="font-semibold text-gray-900">{selectedBooking.serviceName}</div>
              <div className="text-sm text-gray-600 mt-1">
                {formatDate(selectedBooking.bookingDate)} • {formatTime(selectedBooking.bookingTime)}
              </div>
            </div>
          )}

          {actionType === 'reschedule' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-black [color-scheme:light]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-black [color-scheme:light]"
                />
              </div>
            </div>
          )}

          {(actionError || actionSuccess) && (
            <div
              className={`rounded-xl border p-4 ${
                actionError ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'
              }`}
            >
              <div className="font-semibold">{actionError ? 'Action failed' : 'Success'}</div>
              <div className="text-sm mt-1">{actionError || actionSuccess}</div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
