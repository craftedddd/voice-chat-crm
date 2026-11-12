import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Toast beranimasi (satu slot, tidak menumpuk):
 * titik turun dari atas -> mekar menjadi pill -> isi berganti dengan morph
 * (lebar menyesuaikan, teks lama blur keluar) -> menyusut jadi titik lalu naik.
 *
 * show(input) menerima string atau objek:
 *   { text, kind: 'success' | 'info' | 'error' | 'undo', action?: { label, onClick, after? }, duration?, key? }
 * action.after (opsional) adalah isi pengganti setelah tombol ditekan, misalnya "Email unsent".
 */

const DURATION = { info: 2600, success: 2800, undo: 2400, error: 6000 }
const ACTION_DURATION = 6000
const T_DOT = 280 // titik tiba sebelum mekar
const T_CLOSE = 360 // pill menyusut jadi titik
const T_LEAVE = 320 // titik naik dan hilang
const DOT = 40

function normalize(input) {
  const t = typeof input === 'string' ? { text: input } : input
  const kind = t.kind || 'info'
  return {
    kind,
    text: t.text,
    action: t.action || null,
    duration: t.duration ?? (t.action ? ACTION_DURATION : DURATION[kind] || 2600),
    key: t.key || `${kind}:${t.text}`,
  }
}

function createToaster(setView) {
  let item = null
  let phase = 'gone' // enter | dot | open | closing | leave | gone
  let pulse = 0
  let cid = 0
  let hideTimer = 0
  let phaseTimer = 0
  let deadline = 0
  let remaining = 0
  let paused = false

  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const emit = () => setView({ item, phase, pulse })
  const setPhase = (p) => {
    phase = p
    emit()
  }
  const visible = () => phase === 'enter' || phase === 'dot' || phase === 'open'

  function arm(ms) {
    clearTimeout(hideTimer)
    remaining = ms
    deadline = Date.now() + ms
    if (!paused) hideTimer = setTimeout(hide, ms)
  }

  function hide() {
    clearTimeout(hideTimer)
    clearTimeout(phaseTimer)
    if (!item || !visible()) return
    paused = false
    setPhase('closing')
    phaseTimer = setTimeout(() => {
      setPhase('leave')
      phaseTimer = setTimeout(() => {
        item = null
        phase = 'gone'
        emit()
      }, T_LEAVE)
    }, reduce() ? 0 : T_CLOSE)
  }

  function show(input) {
    const next = normalize(input)

    // Pesan yang sama saat masih tampil: cukup berdenyut dan ulang timer
    if (item && visible() && item.key === next.key) {
      pulse += 1
      emit()
      arm(next.duration)
      return
    }

    // Masih tampil (atau sedang menutup): morph ke isi baru di tempat
    if (item && (visible() || phase === 'closing')) {
      clearTimeout(phaseTimer)
      item = { ...next, cid: ++cid }
      if (phase === 'closing') phase = 'open'
      emit()
      arm(next.duration)
      return
    }

    // Toast baru: titik turun dari atas, lalu mekar
    clearTimeout(phaseTimer)
    item = { ...next, cid: ++cid }
    pulse = 0
    paused = false
    setPhase('enter')
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (phase !== 'enter') return
        setPhase('dot')
        phaseTimer = setTimeout(() => setPhase('open'), reduce() ? 0 : T_DOT)
      })
    )
    arm(next.duration + T_DOT)
  }

  function runAction() {
    if (!item?.action) return
    const { onClick, after } = item.action
    onClick?.()
    if (after) {
      item = { ...normalize({ kind: 'undo', ...after }), cid: ++cid }
      emit()
      arm(item.duration)
    } else {
      hide()
    }
  }

  function pause() {
    if (paused || !item) return
    paused = true
    clearTimeout(hideTimer)
    remaining = Math.max(0, deadline - Date.now())
  }

  function resume() {
    if (!paused) return
    paused = false
    if (item && visible()) arm(Math.max(1600, remaining))
  }

  function destroy() {
    clearTimeout(hideTimer)
    clearTimeout(phaseTimer)
  }

  return { show, hide, runAction, pause, resume, destroy }
}

export function useToaster() {
  const [view, setView] = useState({ item: null, phase: 'gone', pulse: 0 })
  const api = useRef(null)
  if (!api.current) api.current = createToaster(setView)
  useEffect(() => () => api.current.destroy(), [])
  return { ...view, api: api.current }
}

/* ---------------- Tampilan ---------------- */

function ToastIcon({ kind }) {
  const common = { width: 18, height: 18, viewBox: '0 0 18 18', 'aria-hidden': true }
  const stroke = { fill: 'none', stroke: '#fff', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (kind === 'success')
    return (
      <svg {...common} className="toast__icon">
        <circle cx="9" cy="9" r="9" fill="#34c759" />
        <path d="m5.4 9.3 2.4 2.4 4.8-5" {...stroke} />
      </svg>
    )
  if (kind === 'error')
    return (
      <svg {...common} className="toast__icon">
        <circle cx="9" cy="9" r="9" fill="#ff6a5c" />
        <path d="M9 4.9v4.8" {...stroke} />
        <circle cx="9" cy="12.7" r="1.05" fill="#fff" />
      </svg>
    )
  if (kind === 'undo')
    return (
      <svg {...common} className="toast__icon">
        <circle cx="9" cy="9" r="9" fill="rgba(255,255,255,0.18)" />
        <path d="M6.6 6.2 4.8 8l1.8 1.8" {...stroke} />
        <path d="M5 8h5.2a2.6 2.6 0 0 1 0 5.2H8.4" {...stroke} />
      </svg>
    )
  return (
    <svg {...common} className="toast__icon">
      <circle cx="9" cy="9" r="9" fill="#6878f0" />
      <circle cx="9" cy="5.6" r="1.05" fill="#fff" />
      <path d="M9 8.2v4.9" {...stroke} />
    </svg>
  )
}

const ToastContent = forwardRef(function ToastContent({ item, className = '', onAction, hidden }, ref) {
  return (
    <div ref={ref} className={`toast__content ${item.action ? 'has-action' : ''} ${className}`} aria-hidden={hidden || undefined}>
      <ToastIcon kind={item.kind} />
      <span className="toast__text">{item.text}</span>
      {item.action && (
        <button className="toast__action" onClick={onAction} tabIndex={hidden ? -1 : 0}>
          {item.action.label}
        </button>
      )}
    </div>
  )
})

export function Toaster({ item, phase, pulse, api }) {
  const contentRef = useRef(null)
  const lastRef = useRef(null)
  const [width, setWidth] = useState(DOT)
  const [prev, setPrev] = useState(null)

  // Simpan isi sebelumnya sebentar agar bisa blur keluar saat morph
  useLayoutEffect(() => {
    const last = lastRef.current
    lastRef.current = item
    if (!item || !last || last.cid === item.cid || phase !== 'open') return
    setPrev(last)
    const t = setTimeout(() => setPrev(null), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.cid])

  // Ukur lebar isi baru agar pill bisa beranimasi ke lebar itu
  // (fallback +1px agar teks tidak terpotong oleh pembulatan sub-pixel)
  useLayoutEffect(() => {
    if (item && contentRef.current) setWidth(contentRef.current.offsetWidth + 1) // offsetWidth tidak terpengaruh transform skala
  }, [item?.cid, item])

  const isError = item?.kind === 'error'

  return (
    <div className="toaster" aria-live="polite">
      {item && (
        <div
          className={`toast toast--${item.kind} is-${phase}`}
          role={isError ? 'alert' : 'status'}
          style={{
            width: phase === 'open' ? width : DOT,
            animationName: pulse ? (pulse % 2 ? 'toast-pulse-a' : 'toast-pulse-b') : 'none',
          }}
          onMouseEnter={api.pause}
          onMouseLeave={api.resume}
          onFocus={api.pause}
          onBlur={api.resume}
        >
          {prev && <ToastContent item={prev} className="is-out" hidden />}
          <ToastContent key={item.cid} ref={contentRef} item={item} className={prev ? 'is-in' : ''} onAction={api.runAction} />
        </div>
      )}
    </div>
  )
}
