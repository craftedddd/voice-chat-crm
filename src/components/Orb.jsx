import { useEffect, useRef } from 'react'

/**
 * Orb kaca. getLevel(t) mengembalikan 0..1; nilainya dihaluskan lalu ditulis
 * ke CSS variable --lvl tiap frame (tanpa re-render React) sehingga animasi
 * mengikuti suara dengan mulus.
 */
export default function Orb({ state, getLevel }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf
    let last = performance.now()
    let lvl = 0

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const target = getLevel(now / 1000)
      const tau = target > lvl ? 0.06 : 0.22 // naik cepat, turun pelan
      lvl += (target - lvl) * (1 - Math.exp(-dt / tau))
      el.style.setProperty('--lvl', (reduce ? lvl * 0.25 : lvl).toFixed(3))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getLevel])

  return (
    <div ref={ref} className={`orb is-${state}`}>
      <div className="orb__blobs">
        <div className="orb__swirl">
          <span className="orb__blob orb__blob--violet" />
          <span className="orb__blob orb__blob--pink" />
          <span className="orb__blob orb__blob--blue" />
          <span className="orb__blob orb__blob--veil" />
        </div>
      </div>
      <div className="orb__glass" />
    </div>
  )
}
