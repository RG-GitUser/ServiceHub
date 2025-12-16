'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { products as mockProducts } from '@/lib/products'

export default function ProductsPage() {
  const router = useRouter()
  const { user, signOut, loading } = useAuth()
  const { addToCart, getTotalItems } = useCart()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const totalItems = getTotalItems()

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

  const categories = ['All', ...Array.from(new Set(mockProducts.map(p => p.category)))]
  const filteredProducts = selectedCategory === 'All'
    ? mockProducts
    : mockProducts.filter(p => p.category === selectedCategory)

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
                className="text-primary-600 font-semibold px-4 py-2 rounded-lg bg-primary-50"
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
                  className="text-primary-600 font-semibold px-3 py-2 rounded-lg bg-primary-50"
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
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Products</h1>
          <p className="text-gray-600">Discover our curated collection of premium products</p>
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] overflow-hidden flex flex-col"
            >
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                    <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Product Image</p>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 truncate pr-2">{product.name}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{product.rating}</span>
                  </div>
                  <div className="text-2xl font-bold text-primary-600">${product.price.toFixed(2)}</div>
                </div>
                <div className="mt-auto pt-4">
                  <button 
                    onClick={(e) => {
                      addToCart(product)
                      // Show a brief visual feedback
                      const button = e.currentTarget
                      const originalText = button.textContent
                      button.textContent = 'Added!'
                      button.classList.add('bg-green-600')
                      setTimeout(() => {
                        button.textContent = originalText
                        button.classList.remove('bg-green-600')
                      }, 1000)
                    }}
                    className="w-full h-12 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

