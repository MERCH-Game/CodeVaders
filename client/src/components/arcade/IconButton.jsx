export default function IconButton({ icon, alt, onClick, ariaLabel, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || alt}
      className={`
        p-0 border-0 bg-transparent cursor-pointer shrink-0 select-none
        transition-all duration-150 ease-out
        hover:brightness-110 hover:-translate-y-1 hover:drop-shadow-[0_0_12px_rgba(244,168,255,0.6)]
        active:brightness-90 active:translate-y-0.5
        focus-visible:outline-3 focus-visible:outline-arcade-pink focus-visible:outline-offset-2
        ${className}
      `}
    >
      <img src={icon} alt={alt} draggable="false" className="block w-full h-full object-contain pointer-events-none select-none" />
    </button>
  )
}
