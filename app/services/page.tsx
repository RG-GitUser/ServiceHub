'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Service {
  id: number
  name: string
  description: string
  duration: string // Display format like "2 hours"
  durationMinutes: number // Duration in minutes for database
  price: number
  category: string
  rating: number
}

const mockServices: Service[] = [
  {
    id: 1,
    name: 'Professional Photography',
    description: 'Professional photo shoot session for portraits, events, or product photography. Includes editing and high-resolution images.',
    duration: '2 hours',
    durationMinutes: 120,
    price: 299,
    category: 'Photography',
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Home Cleaning Service',
    description: 'Deep cleaning service for your home. Includes all rooms, kitchen, bathrooms, and common areas. Eco-friendly products used.',
    duration: '3-4 hours',
    durationMinutes: 210, // Average 3.5 hours
    price: 149,
    category: 'Home Services',
    rating: 4.7,
  },
  {
    id: 3,
    name: 'Personal Training Session',
    description: 'One-on-one personal training session tailored to your fitness goals. Includes workout plan and nutrition advice.',
    duration: '1 hour',
    durationMinutes: 60,
    price: 75,
    category: 'Fitness',
    rating: 4.8,
  },
  {
    id: 4,
    name: 'Web Development Consultation',
    description: 'Expert consultation for your web development needs. Includes code review, architecture planning, and best practices.',
    duration: '1.5 hours',
    durationMinutes: 90,
    price: 199,
    category: 'Technology',
    rating: 5.0,
  },
  {
    id: 5,
    name: 'Massage Therapy',
    description: 'Relaxing full-body massage therapy session. Helps relieve stress, tension, and muscle soreness.',
    duration: '1 hour',
    durationMinutes: 60,
    price: 89,
    category: 'Wellness',
    rating: 4.9,
  },
  {
    id: 6,
    name: 'Tutoring Session',
    description: 'Personalized tutoring session for students. Covers various subjects including math, science, and languages.',
    duration: '1 hour',
    durationMinutes: 60,
    price: 50,
    category: 'Education',
    rating: 4.6,
  },
]

export default function ServicesPage() {
  const router = useRouter()
  const { user, signOut, loading, createBooking } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [city, setCity] = useState('')
  const [age, setAge] = useState('')
  const [consentForm, setConsentForm] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

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

  const categories = ['All', ...Array.from(new Set(mockServices.map(s => s.category)))]
  const filteredServices = selectedCategory === 'All'
    ? mockServices
    : mockServices.filter(s => s.category === selectedCategory)

  const handleBookService = (service: Service) => {
    setSelectedService(service)
  }

  const handleConfirmBooking = async () => {
    if (bookingDate && bookingTime && selectedService && createBooking && consentForm) {
      if (!consentForm) {
        alert('Please accept the consent form to proceed')
        return
      }

      const result = await createBooking(
        selectedService.name,
        selectedService.description,
        selectedService.price,
        selectedService.durationMinutes, // Use integer duration
        bookingDate,
        bookingTime,
        consentForm,
        city || undefined,
        age ? parseInt(age) : undefined
      )

      if (result.success) {
        alert(`Booking confirmed for ${selectedService.name} on ${bookingDate} at ${bookingTime}`)
        setSelectedService(null)
        setBookingDate('')
        setBookingTime('')
        setCity('')
        setAge('')
        setConsentForm(false)
      } else {
        alert(`Failed to create booking: ${result.error}`)
      }
    } else if (!consentForm) {
      alert('Please accept the consent form to proceed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                ServiceHub
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/products"
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Products
              </Link>
              <Link
                href="/services"
                className="text-primary-600 font-semibold px-4 py-2 rounded-lg bg-primary-50"
              >
                Services
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Profile
              </Link>
              <span className="text-gray-600">Welcome, {user.name || user.email}</span>
              <button
                onClick={signOut}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Services</h1>
          <p className="text-gray-600">Schedule professional services tailored to your needs</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-primary-50 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] overflow-hidden"
            >
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                    <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Service Image</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{service.category}</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-gray-700 font-medium">{service.rating}</span>
                    </div>
                    <span className="text-gray-500 text-sm">⏱ {service.duration}</span>
                  </div>
                  <div className="text-2xl font-bold text-primary-600">${service.price}</div>
                </div>
                <button
                  onClick={() => handleBookService(service)}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Book {selectedService.name}</h2>
              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-black mb-2">{selectedService.description}</p>
                <div className="flex items-center justify-between text-sm text-black">
                  <span>Duration: {selectedService.duration}</span>
                  <span className="text-lg font-bold text-primary-600">${selectedService.price}</span>
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-black mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-black placeholder:text-gray-400 [color-scheme:light]"
                  style={{ color: '#000000' }}
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-black mb-2">
                  Select Time
                </label>
                <input
                  type="time"
                  id="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-black placeholder:text-gray-400 [color-scheme:light]"
                  style={{ color: '#000000' }}
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-black mb-2">
                  City (Optional)
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-black"
                  placeholder="Enter your city"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-black mb-2">
                  Age (Optional, 18-80)
                </label>
                <input
                  type="number"
                  id="age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="18"
                  max="80"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-black"
                  placeholder="Enter your age"
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="consentForm"
                  checked={consentForm}
                  onChange={(e) => setConsentForm(e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="consentForm" className="ml-3 text-sm text-black">
                  I agree to the terms and conditions and consent to the service booking <span className="text-red-500">*</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedService(null)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={!bookingDate || !bookingTime || !consentForm}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

