export default function ArcadeButton({ children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full min-h-[48px] px-4 py-3
        border-2 border-white rounded-lg
        bg-arcade-yellow text-arcade-panel
        font-pixel text-[12px] uppercase tracking-widest
        shadow-[0_4px_0_#9c5420]
        transition-all duration-100 ease-out
        hover:brightness-110 hover:shadow-[0_4px_0_#9c5420,0_0_15px_rgba(255,227,110,0.4)]
        active:translate-y-1 active:shadow-[0_0px_0_#9c5420]
        focus-visible:outline-3 focus-visible:outline-arcade-pink focus-visible:outline-offset-2
        ${className}
      `}
    >
      {children}
    </button>
  )
}
