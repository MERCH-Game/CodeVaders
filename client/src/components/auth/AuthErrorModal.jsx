import React from 'react'

export default function AuthErrorModal({ isOpen, title, message, onRetry, onClose }) {
  if (!isOpen) return null

  return (
    <div
      id="auth-error-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="auth-error-title"
      aria-describedby="auth-error-desc"
    >
      <div className="relative w-full max-w-sm p-6 bg-arcade-panel border-2 border-arcade-purple rounded-lg shadow-[0_0_30px_rgba(123,44,255,0.4)] text-center flex flex-col items-center gap-4">
        
        {/* Warning Icon / Pixel Shield */}
        <div className="w-12 h-12 rounded-full bg-arcade-purple/20 border border-arcade-pink flex items-center justify-center text-xl shadow-[0_0_15px_rgba(244,168,255,0.4)]">
          ⚠️
        </div>

        {/* Heading */}
        <h2
          id="auth-error-title"
          className="font-pixel text-xs sm:text-sm text-arcade-pink tracking-wider leading-relaxed"
        >
          {title || 'College email required'}
        </h2>

        {/* Informative Body */}
        <p
          id="auth-error-desc"
          className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans"
        >
          {message || 'College email required. Please sign in with your verified MNNIT student email address (@mnnit.ac.in).'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2.5 mt-2">
          <button
            id="retry-login-btn"
            type="button"
            onClick={onRetry}
            className="w-full py-2.5 px-4 bg-arcade-purple hover:bg-purple-600 active:scale-95 text-white font-pixel text-[10px] sm:text-xs rounded border border-arcade-pink shadow-[0_0_12px_rgba(244,168,255,0.4)] transition-all cursor-pointer"
          >
            Try Another Account
          </button>

          <button
            id="close-error-modal-btn"
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 bg-transparent hover:bg-white/10 active:scale-95 text-gray-400 hover:text-white font-pixel text-[9px] rounded border border-gray-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
