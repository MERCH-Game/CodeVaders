import bgImage from '../../assets/images/bg.png'

export default function ArcadeFrame({ children }) {
  return (
    <div className="relative w-full h-full flex flex-col flex-1 isolate overflow-hidden bg-black text-white">
      {/* Background image */}
      <div 
        className="pointer-events-none absolute inset-0 -z-20 select-none bg-cover bg-center bg-no-repeat opacity-80"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-arcade-bg/40 via-arcade-bg/10 to-arcade-bg/80" />

      {/* Actual content */}
      <div className="relative z-10 flex flex-col w-full h-full">
        {children}
      </div>

      {/* CRT Effects overlays */}
      <div className="arcade-screen-glow" />
      <div className="arcade-crt-overlay" />
    </div>
  )
}
