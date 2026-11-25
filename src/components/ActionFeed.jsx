import { useEffect, useRef, useState } from 'react'
import { CheckIcon } from '../icons.jsx'
import OrderPick, { labelsFor, pickedOf } from './OrderPick.jsx'

export const OPEN_SOON = {
  label: 'Orders are coming soon',
  reply: 'Chats are coming soon',
  stock: 'Products are coming soon',
}
// Langkah tetap terlihat sebentar setelah selesai, lalu item menyusut jadi satu baris
export const COLLAPSE_MS = 1100

// Detik call (angka) atau jam dari mode Chat (teks, misalnya "14:05")
export const clock = (t) => (typeof t === 'string' ? t : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`)

/** Titik di garis waktu. Bentuknya yang menandai status, bukan warnanya. */
export function Node({ state }) {
  return (
    <span className={`tnode tnode--${state}`} aria-hidden="true">
      {state === 'running' && (
        <svg className="tnode__ring" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="5" />
        </svg>
      )}
    </span>
  )
}

/** Baris feed: tingginya membuka dari 0 saat item baru masuk, jadi item lain turun mulus. */
function Row({ isStatic, node, children }) {
  return (
    <li className={`afeed__row ${isStatic ? 'is-static' : ''}`}>
      <div className="afeed__clip">
        <div className="tev">
          <Node state={node} />
          <div className="tev__body">{children}</div>
        </div>
      </div>
    </li>
  )
}

function ActionItem({ item, isStatic, onUndo, onToast }) {
  const { status, kind, steps = [], step = 0 } = item
  const running = status === 'running'
  const done = status === 'done'
  const undone = status === 'undone'
  const note = status === 'note'
  const settled = () => !!item.doneAt && Date.now() - item.doneAt > COLLAPSE_MS
  const [collapsed, setCollapsed] = useState(() => !running && (undone || settled()))

  useEffect(() => {
    if (running) return setCollapsed(false)
    if (undone || settled()) return setCollapsed(true)
    const id = setTimeout(() => setCollapsed(true), COLLAPSE_MS - (Date.now() - (item.doneAt || Date.now())))
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, item.doneAt])

  return (
    <Row isStatic={isStatic} node={status}>
      <div className="tev__row">
        <span className={`tev__title ${undone ? 'is-struck' : ''}`} key={running ? 'run' : 'end'}>
          {note || running ? item.title : item.doneTitle}
        </span>
        <span className="tev__time">{clock(item.t)}</span>
      </div>

      {steps.length > 0 && (
        <div className={`tev__fold ${collapsed ? 'is-collapsed' : ''}`}>
          <ol className="tev__steps">
            {steps.slice(0, Math.min(step + 1, steps.length)).map((s, i) => {
              const ok = !running || i < step
              return (
                <li key={i} className={`tstep ${ok ? 'is-done' : 'is-current'}`}>
                  <span className="tstep__mark" aria-hidden="true">
                    {ok && <CheckIcon size={11} strokeWidth={2} />}
                  </span>
                  {s}
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {(done || undone) && item.orders && (
        <div className="tev__after">
          <OrderPick orders={item.orders} skip={item.skip} compact frozen declined={undone} />
        </div>
      )}
      {(done || undone) && (
        <p className="tev__meta tev__after">
          {undone ? (
            'Undone'
          ) : (
            <>
              {item.detail}
              <span className="tev__links">
                <button className="tlink tlink--accent" onClick={() => onToast(OPEN_SOON[kind] || 'Coming soon')}>
                  Open
                </button>
                <button className="tlink" onClick={() => onUndo(item.id)}>
                  Undo
                </button>
              </span>
            </>
          )}
        </p>
      )}
    </Row>
  )
}

function WaitingItem({ card, isStatic, onAnswer, onToggleOrder }) {
  const picked = pickedOf(card)
  return (
    <Row isStatic={isStatic} node="waiting">
      <div className="tev__row">
        <span className="tev__title">{card.title}</span>
        <span className="tev__time">{clock(card.t)}</span>
      </div>
      <p className="tev__meta">{card.detail}</p>
      {card.orders && <OrderPick orders={card.orders} skip={card.skip} onToggle={onToggleOrder} compact />}
      <div className="tev__ask">
        <button className="tbtn" disabled={picked === 0} onClick={() => onAnswer(card.yes.say)}>
          {picked === null ? card.yes.label : labelsFor(picked)}
        </button>
        <button className="tlink" onClick={() => onAnswer(card.no.say)}>
          {card.no.label}
        </button>
      </div>
    </Row>
  )
}

/** Feed Live actions: aksi assistant selama voice chat, sebagai garis waktu. */
export default function ActionFeed({ phase, feed, waiting, listenOnly, onAnswer, onToggleOrder, onUndo, onToast }) {
  const unit = listenOnly ? 'note' : 'action'
  // Item yang sudah ada saat feed dibuka tidak dianimasikan ulang (misalnya saat pindah tab)
  const initial = useRef(null)
  if (initial.current === null) initial.current = new Set([...feed.map((x) => x.id), waiting && `w:${waiting.step}`])
  const count = feed.filter((x) => x.status !== 'undone').length

  if (phase === 'idle') {
    return (
      <div className="afeed">
        <p className="afeed__hint">Anything the assistant drafts, books, or sends during a voice chat shows up here.</p>
      </div>
    )
  }

  return (
    <div className="afeed">
      <div className="afeed__head">
        <h3 className="afeed__title">{phase === 'live' ? 'This session' : 'Last session'}</h3>
        <span className="afeed__meta">
          {count} {unit}
          {count === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="afeed__list" aria-live="polite">
        {waiting && (
          <WaitingItem
            key={`w:${waiting.step}`}
            card={waiting}
            isStatic={initial.current.has(`w:${waiting.step}`)}
            onAnswer={onAnswer}
            onToggleOrder={onToggleOrder}
          />
        )}
        {feed.map((item) => (
          <ActionItem key={item.id} item={item} isStatic={initial.current.has(item.id)} onUndo={onUndo} onToast={onToast} />
        ))}
      </ul>

      {feed.length === 0 && !waiting && (
        <p className="afeed__hint">
          {phase === 'live'
            ? listenOnly
              ? 'Notes show up here as you talk.'
              : 'Ask for a follow-up, a reminder, or a meeting.'
            : `No ${unit}s this time.`}
        </p>
      )}
    </div>
  )
}
