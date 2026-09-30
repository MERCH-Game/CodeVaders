import background from '../assets/images/bg.png'

export default function ScreenFrame({ children, screenName, className = '' }) {
  return (
    <section
      aria-label={screenName}
      className={`game-screen ${className}`}
      style={{ backgroundImage: `url(${background})` }}
    >
      {children}
    </section>
  )
}