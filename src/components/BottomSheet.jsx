import { useEffect, useRef, useState } from 'react'

const CLOSE_MS = 240 // durasi animasi turun saat ditutup
const DRAG_CLOSE = 90 // tarik ke bawah sejauh ini (px) untuk menutup

/**
 * Bottom sheet untuk mobile: panel putih yang naik dari bawah, menempel ke tepi layar.
 * Tutup dengan tap area gelap, tombol Esc, atau tarik handle ke bawah.
 */
export default function BottomSheet({ open, onClose, label, children }) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const [drag, setDrag] = useState(0)
  const sheetRef = useRef(null)
  const startY = useRef(null)
  const moved = useRef(false)
  const returnFocus = useRef(null)

  // Pasang saat dibuka, beri waktu animasi turun saat ditutup
  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement
      setMounted(true)
      setClosing(false)
      setDrag(0)
      return
    }
    if (!mounted) return
    setClosing(true)
    const t = setTimeout(() => {
      setMounted(false)
      setClosing(false)
      returnFocus.current?.focus?.()
    }, CLOSE_MS)
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    sheetRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  const onPointerDown = (e) => {
    startY.current = e.clientY
    moved.current = false
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (startY.current === null) return
    const dy = Math.max(0, e.clientY - startY.current)
    if (dy > 4) moved.current = true
    setDrag(dy)
  }
  const onPointerUp = () => {
    if (startY.current === null) return
    startY.current = null
    if (drag > DRAG_CLOSE) onClose()
    else setDrag(0)
  }

  const dragging = startY.current !== null && drag > 0

  return (
    <div className={`sheet-root ${closing ? 'is-closing' : ''}`} onClick={onClose}>
      <div
        ref={sheetRef}
        className={`sheet ${dragging ? 'is-dragging' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={drag ? { transform: `translateY(${drag}px)`, '--drag': `${drag}px` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sheet__grip"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <button className="sheet__handle" aria-label={`Close ${label}`} onClick={() => !moved.current && onClose()} />
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  )
}
