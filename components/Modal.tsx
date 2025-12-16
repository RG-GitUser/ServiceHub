'use client'

import { ReactNode, useEffect } from 'react'

type ModalProps = {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidthClassName?: string
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidthClassName = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close modal"
        onClick={onClose}
      />

      <div
        className={`relative w-full ${maxWidthClassName} rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden`}
      >
        {(title || description) && (
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {title && <h2 className="text-2xl font-bold text-gray-900 leading-tight break-words">{title}</h2>}
                {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="px-6 py-5">{children}</div>

        {footer && <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/60">{footer}</div>}
      </div>
    </div>
  )
}


