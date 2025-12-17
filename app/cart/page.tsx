'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { checkoutCartToAppwrite } from '@/lib/purchases'
import { Modal } from '@/components/Modal'
import { AppNav } from '@/components/AppNav'

export default function CartPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)

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

  const totalPrice = getTotalPrice()
  const totalItems = getTotalItems()
  const subtotal = totalPrice
  const totalWithTax = totalPrice * 1.1

  const handleCheckout = async () => {
    setCheckoutError(null)
    setCheckoutSuccess(null)
    setEmailStatus(null)

    if (!items.length) return
    if (!user?.$id) {
      router.push('/signin')
      return
    }

    setCheckoutLoading(true)
    try {
      const result = await checkoutCartToAppwrite({
        userId: user.$id,
        userEmail: user.email,
        userName: user.name,
        items,
      })
      clearCart()
      setCheckoutModalOpen(false)
      const savedCount = items.reduce((n, it) => n + Math.max(1, it.quantity || 1), 0)
      setCheckoutSuccess(
        `Saved ${savedCount} purchase${savedCount === 1 ? '' : 's'} (${new Date(
          result.purchaseDateIso
        ).toLocaleString()})`
      )

      // Send confirmation email (test mode). This runs via a server route so keys stay private.
      try {
        const resp = await fetch('/api/order-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            userName: user.name,
            purchaseDateIso: result.purchaseDateIso,
            purchases: items.map((it) => ({
              item: it.name,
              purchaseType: it.category,
              quantity: Math.max(1, it.quantity || 1),
              unitPrice: it.price,
            })),
            subtotal,
            total: totalWithTax,
          }),
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          setEmailStatus(data?.error || 'Email failed to send (server not configured)')
        } else {
          setEmailStatus('Confirmation email sent (test mode)')
        }
      } catch (e: any) {
        setEmailStatus(e?.message || 'Email failed to send')
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.message ||
        'Checkout failed. Please confirm Appwrite Database + collection IDs and permissions.'
      setCheckoutError(msg)
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">Review your items and proceed to checkout</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start adding items to your cart to see them here</p>
            <Link
              href="/products"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {(checkoutError || checkoutSuccess) && (
                <div
                  className={`rounded-2xl p-4 border ${
                    checkoutError
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}
                >
                  <div className="font-semibold">{checkoutError ? 'Checkout error' : 'Checkout complete'}</div>
                  <div className="text-sm mt-1">{checkoutError || checkoutSuccess}</div>
                  {!!emailStatus && !checkoutError && (
                    <div className="text-sm mt-2 border-t border-green-200 pt-2">{emailStatus}</div>
                  )}
                </div>
              )}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row gap-6"
                >
                  <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <label className="text-sm text-gray-600">Quantity:</label>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 text-gray-900 font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${item.price.toFixed(2)} each
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-medium">${(totalPrice * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-primary-600">${(totalPrice * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <button
                  className={`w-full py-4 rounded-lg font-semibold transition-colors text-lg mb-4 ${
                    checkoutLoading
                      ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                  onClick={() => setCheckoutModalOpen(true)}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Processing…' : 'Proceed to Checkout'}
                </button>
                <Link
                  href="/products"
                  className="block text-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Modal
        open={checkoutModalOpen}
        onClose={() => (checkoutLoading ? null : setCheckoutModalOpen(false))}
        title="Confirm purchase"
        description="This is a demo checkout (no real payment processed). We’ll save your purchases and email you a receipt."
        maxWidthClassName="max-w-xl"
        footer={
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCheckoutModalOpen(false)}
              disabled={checkoutLoading}
              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="flex-1 h-12 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {checkoutLoading ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700 mt-2">
              <span>Tax</span>
              <span className="font-semibold">${(subtotal * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base text-gray-900 mt-3 pt-3 border-t border-gray-200">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary-700">${totalWithTax.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="font-semibold text-gray-900">Items ({totalItems})</div>
            <div className="mt-3 space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{it.name}</div>
                    <div className="text-gray-500">{it.category} • qty {it.quantity}</div>
                  </div>
                  <div className="font-semibold text-gray-900">${(it.price * it.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {(checkoutError || checkoutSuccess || emailStatus) && (
            <div
              className={`rounded-xl border p-4 ${
                checkoutError ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'
              }`}
            >
              <div className="font-semibold">{checkoutError ? 'Checkout error' : 'Checkout status'}</div>
              <div className="text-sm mt-1">{checkoutError || checkoutSuccess || emailStatus}</div>
              {!checkoutError && emailStatus && <div className="text-sm mt-1">{emailStatus}</div>}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}


