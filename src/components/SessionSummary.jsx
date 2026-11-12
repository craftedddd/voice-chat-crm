import { useState } from 'react'
import Orb from './Orb.jsx'
import { AI_MODES } from './SettingsPanel.jsx'
import {
  MicIcon,
  SendIcon,
  BellIcon,
  FileTextIcon,
  CalendarIcon,
  CopyIcon,
  DownloadIcon,
  ThumbUpIcon,
  ThumbDownIcon,
  ZapIcon,
} from '../icons.jsx'

const still = () => 0

const ACTION_ICON = { send: SendIcon, remind: BellIcon, calendar: CalendarIcon, draft: FileTextIcon }
const WHO = { user: 'You', ai: 'Assistant', note: 'Note' }

export function formatTime(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const modeTitle = (id) => AI_MODES.find((m) => m.id === id)?.title || 'Brief answers'
const clock = (ms) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(ms)

/** Teks ringkasan (dipakai untuk salin dan unduh). */
function summaryText(sum, withTranscript) {
  const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(sum.startedAt)
  const lines = [
    'Voice chat summary',
    `${day} | ${formatTime(sum.duration)} | ${modeTitle(sum.mode)} | ${sum.tab}`,
    '',
  ]
  if (sum.actions.length) {
    lines.push('Actions taken')
    sum.actions.forEach((a) => lines.push(`- ${a.label}`))
    lines.push('')
  }
  if (sum.notes.length) {
    lines.push('Notes')
    sum.notes.forEach((n) => lines.push(`- ${n}`))
    lines.push('')
  }
  if (sum.topics.length) lines.push(`Topics: ${sum.topics.join(', ')}`, '')
  if (sum.nextUp) lines.push(`Up next: ${sum.nextUp}`, '')
  if (withTranscript && sum.transcript.length) {
    lines.push('Transcript')
    sum.transcript.forEach((x) => lines.push(`[${formatTime(x.t)}] ${WHO[x.who]}: ${x.text}`))
  }
  return lines.join('\n').trim() + '\n'
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Cadangan untuk browser tanpa izin clipboard
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

function downloadText(text, startedAt) {
  const d = new Date(startedAt)
  const pad = (n) => String(n).padStart(2, '0')
  const name = `voice-chat-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.txt`
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function SessionSummary({ summary: sum, onRestart, onToast }) {
  const [view, setView] = useState('summary')
  const [rating, setRating] = useState(null)
  const listen = sum.mode === 'listen'

  const stats = [
    { label: 'Duration', value: formatTime(sum.duration) },
    { label: listen ? 'Notes' : 'Exchanges', value: listen ? sum.notes.length : sum.exchanges },
    { label: 'Actions', value: sum.actions.length },
  ]

  const onCopy = async () => {
    const ok = await copyText(summaryText(sum, false))
    onToast(ok ? 'Summary copied to clipboard' : "Couldn't copy. Try downloading instead.")
  }
  const onDownload = () => {
    downloadText(summaryText(sum, true), sum.startedAt)
    onToast('Summary and transcript downloaded')
  }
  const rate = (v) => setRating((cur) => (cur === v ? null : v))

  return (
    <div className="summary">
      <header className="summary__head">
        <div className="summary__orb">
          <Orb state="idle" getLevel={still} />
        </div>
        <div>
          <h2 className="summary__title">Voice chat ended</h2>
          <p className="summary__meta">
            Today, {clock(sum.startedAt)} · {modeTitle(sum.mode)} · {sum.tab}
          </p>
        </div>
      </header>

      <dl className="summary__stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="stabs" role="tablist" aria-label="Session details">
        <button role="tab" aria-selected={view === 'summary'} className={view === 'summary' ? 'is-active' : ''} onClick={() => setView('summary')}>
          Summary
        </button>
        <button role="tab" aria-selected={view === 'transcript'} className={view === 'transcript' ? 'is-active' : ''} onClick={() => setView('transcript')}>
          Transcript <span className="stabs__count">{sum.transcript.length}</span>
        </button>
      </div>

      <div className="summary__body" role="tabpanel">
        {view === 'summary' ? (
          <>
            {(!listen || sum.actions.length > 0) && (
              <section className="sblock">
                <h3 className="sblock__title">Actions taken</h3>
                {sum.actions.length ? (
                  <ul className="alist">
                    {sum.actions.map((a, i) => {
                      const Icon = ACTION_ICON[a.kind] || FileTextIcon
                      return (
                        <li key={i} className="alist__item">
                          <span className="alist__icon">
                            <Icon size={15} />
                          </span>
                          {a.label}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="sblock__empty">No actions this time. When the assistant offers help, say yes and it will show up here.</p>
                )}
              </section>
            )}

            {listen && (
              <section className="sblock">
                <h3 className="sblock__title">Notes</h3>
                {sum.notes.length ? (
                  <ul className="nlist">
                    {sum.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="sblock__empty">No notes were captured. Speak while Listen only is on and each sentence is saved here.</p>
                )}
              </section>
            )}

            {sum.topics.length > 0 && (
              <section className="sblock">
                <h3 className="sblock__title">Topics</h3>
                <div className="chips">
                  {sum.topics.map((t) => (
                    <span className="chip" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {sum.nextUp && (
              <div className="nextup">
                <span className="nextup__icon">
                  <ZapIcon size={14} />
                </span>
                <p>
                  <strong>Up next:</strong> {sum.nextUp}
                </p>
              </div>
            )}
          </>
        ) : sum.transcript.length ? (
          <ol className="tlist">
            {sum.transcript.map((x, i) => (
              <li key={i} className={`tlist__item is-${x.who}`}>
                <div className="tlist__who">
                  {WHO[x.who]} <span>{formatTime(x.t)}</span>
                </div>
                <p className="tlist__text">{x.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="sblock__empty">Nothing was said in this session.</p>
        )}
      </div>

      <footer className="summary__foot">
        <div className="rate">
          <span className="rate__label" aria-live="polite">
            {rating ? 'Thanks for the feedback' : 'Was this helpful?'}
          </span>
          <button className={`rate__btn ${rating === 'up' ? 'is-on' : ''}`} aria-label="Helpful" aria-pressed={rating === 'up'} onClick={() => rate('up')}>
            <ThumbUpIcon size={16} />
          </button>
          <button className={`rate__btn ${rating === 'down' ? 'is-on' : ''}`} aria-label="Not helpful" aria-pressed={rating === 'down'} onClick={() => rate('down')}>
            <ThumbDownIcon size={16} />
          </button>
        </div>

        <div className="summary__actions">
          <button className="sbtn" onClick={onCopy} aria-label="Copy summary" title="Copy summary">
            <CopyIcon size={16} />
          </button>
          <button className="sbtn" onClick={onDownload} aria-label="Download summary and transcript" title="Download summary and transcript">
            <DownloadIcon size={16} />
          </button>
          <button className="pbtn" onClick={onRestart}>
            <MicIcon size={16} /> New chat
          </button>
        </div>
      </footer>
    </div>
  )
}
