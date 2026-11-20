import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PlusIcon, ChevronDownIcon, TrashIcon } from '../icons.jsx'

const HOLD_MS = 400 // tekan lama di layar sentuh sebelum drag dimulai
const TOUCH_SLOP = 8 // geser lebih dari ini sebelum HOLD_MS = scroll biasa, bukan drag
const MOUSE_SLOP = 5 // mouse: geser sejauh ini untuk mulai drag
const ROW_REACH = 48 // jarak vertikal dari deretan tab yang masih dihitung untuk mengubah urutan
const BUILTIN_LIFT = 12 // tab bawaan hanya bisa diangkat sedikit (tidak bisa dihapus)

const buzz = (ms) => navigator.vibrate?.(ms)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Deretan tab context. Semua tab bisa di-drag untuk mengubah urutan.
 * Tab custom bisa dilepas di zona merah di bawah layar untuk dihapus.
 * Tab custom yang aktif bisa diklik lagi untuk membuka editor.
 */
export default function ContextTabs({
  tabs,
  activeId,
  onSelect,
  onEdit,
  onAdd,
  onReorder,
  onDelete,
  editorFor, // 'new' | id tab | null
  editor, // isi popover (desktop); null di mobile
  onCloseEditor,
}) {
  const wrapRef = useRef(null)
  const rowRef = useRef(null)
  const zoneRef = useRef(null)
  const plusRef = useRef(null)
  const popRef = useRef(null)
  const btns = useRef(new Map())
  const drag = useRef(null)
  const flip = useRef(null)
  const suppressClick = useRef(false)

  const [dragId, setDragId] = useState(null)
  const [order, setOrder] = useState(null) // urutan sementara selama drag
  // Tab yang di-drag tampil sebagai "bayangan" di atas halaman, supaya tidak terpotong deretan tab
  // yang bisa di-scroll di mobile. Tab aslinya jadi slot kosong di deretan.
  const [ghost, setGhost] = useState(null) // { x, y, w }
  const [zone, setZone] = useState(null) // null | 'idle' | 'hot'
  const [popPos, setPopPos] = useState(null)

  const byId = new Map(tabs.map((t) => [t.id, t]))
  const shown = order ? order.map((id) => byId.get(id)).filter(Boolean) : tabs

  // Posisi tab tanpa transform, dalam koordinat layar
  const layoutBox = (el) => {
    const base = wrapRef.current.getBoundingClientRect()
    const scroll = rowRef.current.scrollLeft
    return { left: base.left + el.offsetLeft - scroll, top: base.top + el.offsetTop, width: el.offsetWidth }
  }

  function place() {
    const d = drag.current
    const el = d && btns.current.get(d.id)
    if (!el) return
    const box = layoutBox(el)
    let y = d.y - d.grabY
    if (!d.custom) y = box.top + clamp(y - box.top, -BUILTIN_LIFT, BUILTIN_LIFT)
    setGhost({ x: d.x - d.grabX, y, w: el.offsetWidth })
  }

  function begin() {
    const d = drag.current
    const el = btns.current.get(d.id)
    if (!el) return
    const rect = el.getBoundingClientRect()
    d.active = true
    d.grabX = d.startX - rect.left
    d.grabY = d.startY - rect.top
    d.x = d.startX
    d.y = d.startY
    d.order = tabs.map((t) => t.id)
    d.hot = false
    setOrder(d.order)
    setDragId(d.id)
    setGhost({ x: rect.left, y: rect.top, w: rect.width })
    setZone(d.custom ? 'idle' : null)
    document.body.classList.add('is-dragging-tab')
    buzz(8)
  }

  function move(e) {
    const d = drag.current
    if (!d || e.pointerId !== d.pointerId) return
    const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY)
    if (!d.active) {
      if (d.touch) {
        if (dist > TOUCH_SLOP) cancel()
        return
      }
      if (dist < MOUSE_SLOP) return
      begin()
    }
    d.x = e.clientX
    d.y = e.clientY

    // Zona hapus (hanya tab custom)
    if (d.custom && zoneRef.current) {
      const hot = d.y >= zoneRef.current.getBoundingClientRect().top
      if (hot !== d.hot) {
        d.hot = hot
        setZone(hot ? 'hot' : 'idle')
        if (hot) buzz(12)
      }
    }

    // Ubah urutan selama pointer masih dekat deretan tab
    const row = rowRef.current.getBoundingClientRect()
    if (!d.hot && d.y > row.top - ROW_REACH && d.y < row.bottom + ROW_REACH) {
      const others = d.order.filter((id) => id !== d.id)
      // Pointer dicocokkan ke baris tab terdekat (deretan bisa terbungkus jadi dua baris di desktop).
      // Tab lain dihitung "sebelum" kalau barisnya di atas, atau sebaris dan tengahnya di kiri pointer.
      const boxes = others.map((id) => {
        const el = btns.current.get(id)
        return el ? { ...layoutBox(el), mid: el.offsetHeight / 2 } : null
      })
      const line = boxes.reduce(
        (best, b) => (b && (best === null || Math.abs(b.top + b.mid - d.y) < Math.abs(best + b.mid - d.y)) ? b.top : best),
        null
      )
      const at = boxes.filter(
        (b) => b && (b.top < line - 1 || (Math.abs(b.top - line) <= 1 && b.left + b.width / 2 < d.x))
      ).length
      const next = [...others.slice(0, at), d.id, ...others.slice(at)]
      if (next.join() !== d.order.join()) {
        // Catat posisi lama untuk animasi geser (FLIP)
        flip.current = new Map(others.map((id) => [id, btns.current.get(id)?.getBoundingClientRect().left]))
        d.order = next
        setOrder(next)
        return
      }
    }
    place()
  }

  function finish(e, cancelled = false) {
    const d = drag.current
    if (!d || (e && e.pointerId !== d.pointerId)) return
    clearTimeout(d.timer)
    drag.current = null
    window.removeEventListener('pointermove', live.move)
    window.removeEventListener('pointerup', live.up)
    window.removeEventListener('pointercancel', live.cancel)
    if (!d.active) return
    // Klik yang menyusul setelah drag tidak dihitung sebagai memilih tab
    suppressClick.current = true
    setTimeout(() => (suppressClick.current = false), 300)
    document.body.classList.remove('is-dragging-tab')
    if (!cancelled && d.custom && d.hot) onDelete(d.id)
    else if (!cancelled && d.order.join() !== tabs.map((t) => t.id).join()) onReorder(d.order)
    setOrder(null)
    setDragId(null)
    setGhost(null)
    setZone(null)
  }
  const cancel = () => finish(null, true)

  // Listener window harus stabil antar render, tapi memanggil versi fungsi terbaru
  const handlers = useRef({})
  handlers.current = { move, finish }
  const [live] = useState(() => ({
    move: (e) => handlers.current.move(e),
    up: (e) => handlers.current.finish(e),
    cancel: (e) => handlers.current.finish(e, true),
  }))

  function onPointerDown(e, tab) {
    if (e.button !== 0 || drag.current) return
    const touch = e.pointerType === 'touch'
    drag.current = {
      id: tab.id,
      custom: !!tab.custom,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      touch,
      active: false,
    }
    if (touch) drag.current.timer = setTimeout(() => drag.current && begin(), HOLD_MS)
    window.addEventListener('pointermove', live.move)
    window.addEventListener('pointerup', live.up)
    window.addEventListener('pointercancel', live.cancel)
  }

  // Selama drag di layar sentuh, deretan tab tidak ikut ter-scroll
  useEffect(() => {
    const row = rowRef.current
    const block = (e) => drag.current?.active && e.preventDefault()
    row.addEventListener('touchmove', block, { passive: false })
    return () => {
      row.removeEventListener('touchmove', block)
      document.body.classList.remove('is-dragging-tab')
    }
  }, [])

  // Setelah urutan berubah: tab lain bergeser mulus, tab yang di-drag tetap di bawah pointer
  useLayoutEffect(() => {
    const prev = flip.current
    flip.current = null
    if (prev && !reducedMotion()) {
      const duration = parseFloat(token('--dur-base')) || 0
      const easing = token('--ease') || 'ease'
      prev.forEach((left, id) => {
        const el = btns.current.get(id)
        if (!el || left == null) return
        const dx = left - el.getBoundingClientRect().left
        if (!dx) return
        el.animate([{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }], { duration, easing })
      })
    }
    if (drag.current?.active) place()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  function onKeyDown(e, tab) {
    if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault()
    const ids = tabs.map((t) => t.id)
    const i = ids.indexOf(tab.id)
    const j = clamp(i + (e.key === 'ArrowLeft' ? -1 : 1), 0, ids.length - 1)
    if (i === j) return
    ids.splice(i, 1)
    ids.splice(j, 0, tab.id)
    onReorder(ids)
  }

  function onClick(tab) {
    if (suppressClick.current) return
    if (tab.custom && tab.id === activeId) onEdit(tab.id)
    else onSelect(tab.id)
  }

  // Popover editor (desktop): menempel di bawah tombol yang membukanya
  const anchorEl = () => (editorFor === 'new' ? plusRef.current : btns.current.get(editorFor))
  useLayoutEffect(() => {
    if (!editor || !editorFor) return setPopPos(null)
    const a = anchorEl()
    const pop = popRef.current
    if (!a || !pop) return
    const maxLeft = wrapRef.current.clientWidth - pop.offsetWidth
    // Tinggi dibatasi layar; sisanya bisa di-scroll di dalam popover
    const room = window.innerHeight - a.getBoundingClientRect().bottom - 24
    setPopPos({
      left: clamp(a.offsetLeft - rowRef.current.scrollLeft, 0, Math.max(0, maxLeft)),
      top: a.offsetTop + a.offsetHeight,
      maxHeight: Math.max(240, room),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, editorFor, tabs])

  useEffect(() => {
    if (!editor || !editorFor) return
    const anchor = anchorEl()
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || anchor?.contains(e.target)) return
      onCloseEditor()
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      onCloseEditor()
      anchor?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, editorFor])

  return (
    <div className="ctxtabs" ref={wrapRef}>
      <div className="tabs" role="tablist" aria-label="Voice chat context" ref={rowRef}>
        {shown.map((t) => {
          const active = activeId === t.id
          const dragging = dragId === t.id
          return (
            <button
              key={t.id}
              ref={(el) => (el ? btns.current.set(t.id, el) : btns.current.delete(t.id))}
              role="tab"
              aria-selected={active}
              aria-haspopup={t.custom && active ? 'dialog' : undefined}
              aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
              className={`tab ${active ? 'is-active' : ''} ${dragging ? 'is-placeholder' : ''}`}
              onPointerDown={(e) => onPointerDown(e, t)}
              onContextMenu={(e) => drag.current && e.preventDefault()}
              onKeyDown={(e) => onKeyDown(e, t)}
              onClick={() => onClick(t)}
            >
              {t.label}
              {t.custom && active && (
                <span className="tab__chev" aria-hidden="true">
                  <ChevronDownIcon size={14} />
                </span>
              )}
            </button>
          )
        })}
        <button
          ref={plusRef}
          className="tab tab--plus"
          aria-label="Add context"
          aria-haspopup="dialog"
          aria-expanded={editorFor === 'new'}
          onClick={onAdd}
        >
          <PlusIcon size={15} />
        </button>
      </div>

      {editor && editorFor && (
        <div
          ref={popRef}
          className="ctxpop"
          role="dialog"
          aria-label={editorFor === 'new' ? 'New context' : 'Edit context'}
          style={popPos || { visibility: 'hidden' }}
        >
          {editor}
        </div>
      )}

      {ghost &&
        dragId &&
        createPortal(
          <div
            className={`tab tab--ghost ${activeId === dragId ? 'is-active' : ''} ${zone === 'hot' ? 'is-doomed' : ''}`}
            style={{ left: ghost.x, top: ghost.y, width: ghost.w }}
            aria-hidden="true"
          >
            {byId.get(dragId)?.label}
            {byId.get(dragId)?.custom && activeId === dragId && (
              <span className="tab__chev">
                <ChevronDownIcon size={14} />
              </span>
            )}
          </div>,
          document.body
        )}

      {zone &&
        createPortal(
          <div ref={zoneRef} className={`delzone ${zone === 'hot' ? 'is-hot' : ''}`} aria-hidden="true">
            <TrashIcon size={22} />
            <span>{zone === 'hot' ? 'Release to delete' : 'Drag here to delete'}</span>
          </div>,
          document.body
        )}
    </div>
  )
}
