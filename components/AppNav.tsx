'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'

type NavItem = {
  href: string
  label: string
  shortLabel?: string
}

const navItems: NavItem[] = [
  { href: '/products', label: 'Browse Products', shortLabel: 'Products' },
  { href: '/services', label: 'Book Services', shortLabel: 'Services' },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-6 h-6'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-6 h-6'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-6 h-6'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function AppNav() {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()
  const [mobileOpen, setMobileOpen] = useState(false)

  const itemsForUser = useMemo(() => navItems, [])
  const isAuthed = !loading && !!user

  const desktopLinkClass = (href: string) => {
    const active = isActivePath(pathname, href)
    return active
      ? 'text-primary-600 font-semibold px-4 py-2 rounded-lg bg-primary-50'
      : 'text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors'
  }

  const mobileLinkClass = (href: string) => {
    const active = isActivePath(pathname, href)
    return active
      ? 'w-full text-left px-4 py-3 rounded-xl bg-primary-50 text-primary-700 font-semibold'
      : 'w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-800 font-semibold'
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center min-w-0">
            <Link href="/" className="flex items-center -ml-2" onClick={() => setMobileOpen(false)}>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent truncate">
                ServiceHub
              </h1>
            </Link>
          </div>

          {/* Center links (desktop) */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-4">
            {isAuthed &&
              itemsForUser.map((it) => (
                <Link key={it.href} href={it.href} className={desktopLinkClass(it.href)}>
                  {it.label}
                </Link>
              ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthed ? (
              <>
                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-2 lg:gap-3">
                  <Link
                    href="/profile"
                    className={desktopLinkClass('/profile')}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/cart"
                    className={`relative px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors ${
                      isActivePath(pathname, '/cart') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                    }`}
                    aria-label="Cart"
                  >
                    <CartIcon className="w-6 h-6" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  <span className="hidden lg:inline text-gray-600 max-w-[18rem] truncate">
                    Welcome, {user?.name || user?.email}
                  </span>
                  <button
                    onClick={signOut}
                    className="bg-primary-600 text-white h-11 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center font-semibold whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Mobile actions */}
                <div className="md:hidden flex items-center gap-2">
                  <Link
                    href="/cart"
                    className={`relative h-11 w-11 rounded-lg flex items-center justify-center transition-colors ${
                      isActivePath(pathname, '/cart') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-label="Cart"
                    onClick={() => setMobileOpen(false)}
                  >
                    <CartIcon className="w-6 h-6" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    className="h-11 w-11 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    onClick={() => setMobileOpen((v) => !v)}
                  >
                    {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/signin"
                  className="text-gray-700 hover:text-primary-600 h-11 px-3 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center font-semibold whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-600 text-white h-11 px-3 sm:px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center font-semibold whitespace-nowrap"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {isAuthed && (
        <div className={`md:hidden ${mobileOpen ? 'block' : 'hidden'} border-t border-gray-200 bg-white/95 backdrop-blur-md`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-col gap-2">
              {itemsForUser.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className={mobileLinkClass(it.href)}
                  onClick={() => setMobileOpen(false)}
                >
                  {it.shortLabel || it.label}
                </Link>
              ))}
              <Link
                href="/profile"
                className={mobileLinkClass('/profile')}
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  signOut()
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
              >
                Sign Out
              </button>
              <div className="px-4 py-2 text-xs text-gray-600 truncate">
                Signed in as {user?.email}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

