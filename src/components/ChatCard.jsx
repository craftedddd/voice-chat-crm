import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MicIcon, MicOffIcon, SendIcon, CloseIcon, CheckIcon, ChevronDownIcon } from '../icons.jsx'
import { Node, OPEN_SOON, COLLAPSE_MS, clock as feedClock } from './ActionFeed.jsx'

const clock = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
const CALL_STATUS = {
  connecting: 'Connecting',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
}

// Tempo tulisan: maksimal 40 ms per kata, total sekitar 1,5 detik untuk jawaban panjang
const STREAM_TOTAL_MS = 1500
const STREAM_MAX_STEP_MS = 40
const STREAM_MIN_STEP_MS = 16
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Jawaban assistant muncul kata demi kata (tiap kata memudar masuk).
 * Screen reader membaca teks utuh sekali; kata yang beranimasi disembunyikan darinya.
 */
function StreamText({ text, skip, onTick, onDone }) {
  const words = text.split(' ')
  const [n, setN] = useState(0)
  const finished = skip || n > words.length

  useEffect(() => {
    if (finished) {
      onDone()
      return
    }
    const step = Math.max(STREAM_MIN_STEP_MS, Math.min(STREAM_MAX_STEP_MS, STREAM_TOTAL_MS / words.length))
    // Satu langkah ekstra setelah kata terakhir supaya fade kata terakhir selesai dulu
    const id = setTimeout(() => setN((x) => x + 1), n === words.length ? step * 6 : step)
    onTick()
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, finished])

  if (finished) return text
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.slice(0, n).map((w, i) => (
          <Fragment key={i}>
            {i ? ' ' : ''}
            <span className="sword">{w}</span>
          </Fragment>
        ))}
      </span>
    </>
  )
}

/**
 * Jawaban assistant di chat, dua paragraf dengan jarak:
 * 1. Yang sudah dikerjakan atau informasinya.
 * 2. Tawaran berikutnya. Kalau masih menunggu jawaban, chip jawabannya ada di bawahnya.
 * Saat beranimasi: paragraf pertama ditulis dulu, lalu paragraf kedua, lalu chip.
 */
function AiMessage({ m, animate, skip, active, chips, onTick, onDone }) {
  const { body, next } = m.parts
  const [stage, setStage] = useState(animate ? 0 : 2) // 0 tulis body, 1 tulis next, 2 selesai
  const finish = () => {
    setStage(2)
    onDone()
  }

  return (
    <div className="aimsg">
      <p className="chatmsg">
        {animate ? (
          <StreamText text={body} skip={skip} onTick={onTick} onDone={() => (next ? setStage((x) => Math.max(x, 1)) : finish())} />
        ) : (
          body
        )}
      </p>
      {next && stage >= 1 && (
        <p className="chatmsg">{animate ? <StreamText text={next} skip={skip} onTick={onTick} onDone={finish} /> : next}</p>
      )}
      {active && stage === 2 && chips}
    </div>
  )
}

/**
 * Kartu aksi di percakapan (mode Chat di HP). Saat berjalan langkahnya dicentang satu per satu.
 * Setelah selesai menyusut jadi satu baris; ketuk barisnya untuk melihat langkah, detail, Open, dan Undo.
 */
function ChatAction({ item, isNew, onUndo, onToast }) {
  const { status, steps = [], step = 0 } = item
  const running = status === 'running'
  const undone = status === 'undone'
  const settled = () => !!item.doneAt && Date.now() - item.doneAt > COLLAPSE_MS
  const [open, setOpen] = useState(() => running)
  const bodyId = `chatact-${item.id}`

  // Setelah selesai, langkah tetap terlihat sebentar lalu kartu menyusut sendiri
  useEffect(() => {
    if (running) return setOpen(true)
    if (undone || settled()) return
    const id = setTimeout(() => setOpen(false), COLLAPSE_MS - (Date.now() - (item.doneAt || Date.now())))
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, item.doneAt])

  const title = running ? item.title : item.doneTitle
  return (
    <div className={`tev chatact ${isNew ? 'is-new' : ''}`}>
      <Node state={status} />
      <div className="tev__body">
        {running ? (
          <p className="chatact__head">
            <span className="tev__title">{title}</span>
            <span className="tev__time">{feedClock(item.t)}</span>
          </p>
        ) : (
          <button
            type="button"
            className="chatact__head"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`tev__title ${undone ? 'is-struck' : ''}`}>{title}</span>
            <ChevronDownIcon size={14} className="chatact__chev" />
            <span className="tev__time">{feedClock(item.t)}</span>
          </button>
        )}

        <div id={bodyId} className={`tev__fold ${open ? '' : 'is-collapsed'}`} inert={open ? undefined : ''}>
          <div className="chatact__fold">
            {undone ? (
              <p className="tev__meta">Undone</p>
            ) : (
              <>
                {steps.length > 0 && (
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
                )}
                {!running && (
                  <p className="tev__meta chatact__meta">
                    {item.detail}
                    <span className="tev__links">
                      <button type="button" className="tlink tlink--accent" onClick={() => onToast(OPEN_SOON[item.kind] || 'Coming soon')}>
                        Open
                      </button>
                      <button type="button" className="tlink" onClick={() => onUndo(item.id)}>
                        Undo
                      </button>
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Penanda call yang masih berjalan saat user pindah ke mode Chat. */
function CallBar({ call, onOpen, onMute, onEnd }) {
  return (
    <div className="callbar" role="status">
      <button type="button" className="callbar__info" onClick={onOpen} aria-label="Open voice call">
        <span className="callbar__dot" aria-hidden="true" />
        <span className="callbar__title">Voice call</span>
        <span className="callbar__meta">
          {clock(call.seconds)} · {call.muted ? 'Muted' : CALL_STATUS[call.status] || 'Live'}
        </span>
      </button>
      <button
        type="button"
        className="callbar__btn"
        aria-label={call.muted ? 'Unmute' : 'Mute'}
        aria-pressed={call.muted}
        onClick={onMute}
      >
        {call.muted ? <MicOffIcon size={17} /> : <MicIcon size={17} />}
      </button>
      <button type="button" className="callbar__btn callbar__btn--end" aria-label="End call" onClick={onEnd}>
        <CloseIcon size={16} />
      </button>
    </div>
  )
}

/**
 * Mode Chat. Percakapannya sama dengan mode Voice: transkrip call masuk sebagai bubble,
 * dan pesan yang diketik dijawab oleh "otak" yang sama.
 */
export default function ChatCard({
  messages,
  feed = [],
  inlineActions,
  onUndo,
  onToast,
  typing,
  waiting,
  call,
  spoken,
  onOpenChat,
  onSend,
  onAnswer,
  onVoice,
  onMute,
  onEnd,
}) {
  const [text, setText] = useState('')
  const logRef = useRef(null)
  const inCall = !!call && call.status !== 'idle' && call.status !== 'ended'

  // Hanya pesan yang datang setelah kartu dibuka yang beranimasi (pindah mode tidak memutar ulang)
  const [mountMax] = useState(() => messages.reduce((max, m) => Math.max(max, m.id), 0))
  const [doneIds, setDoneIds] = useState(() => new Set())
  const [skipAll, setSkipAll] = useState(0) // id terakhir yang dilewati (user mengirim pesan baru)
  const [reduced] = useState(reducedMotion)
  const streams = (m) => m.who === 'ai' && m.via === 'chat' && m.id > mountMax && !reduced
  const streaming = messages.some((m) => streams(m) && !doneIds.has(m.id) && m.id > skipAll)
  const markDone = (id) => setDoneIds((d) => (d.has(id) ? d : new Set(d).add(id)))

  // Kartu aksi hanya tampil di percakapan pada layar HP; di layar lebih besar feed Actions ada di samping
  const actionOf = (m) => feed.find((x) => x.id === m.actionId)
  const shown = inlineActions ? messages : messages.filter((m) => m.who !== 'action')

  const scrollToEnd = () => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  useEffect(() => {
    onOpenChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Langkah kartu aksi yang sedang berjalan. Undo atau buka-tutup kartu lama tidak ikut menggulir.
  const runningKey = inlineActions ? feed.filter((x) => x.status === 'running').map((x) => `${x.id}:${x.step}`).join() : ''

  // Selalu gulir ke pesan terbaru
  useLayoutEffect(scrollToEnd, [messages.length, typing, waiting?.step, streaming, spoken?.n, runningKey])

  const submit = (e) => {
    e.preventDefault()
    // Kirim pesan baru: jawaban yang masih ditulis langsung tampil penuh
    setSkipAll(messages.length ? messages[messages.length - 1].id : 0)
    if (onSend(text)) setText('')
  }

  const answer = (say) => {
    setSkipAll(messages.length ? messages[messages.length - 1].id : 0)
    onAnswer(say)
  }

  // Saat call berjalan, jawaban yang sedang diucapkan muncul mengikuti suaranya
  const speakingNow = (m) => inCall && call.status === 'speaking' && spoken && spoken.id === m.id

  // Chip jawaban hanya di bawah pesan terakhir yang masih menunggu jawaban
  const last = shown[shown.length - 1]
  // Kartu aksi yang sedang berjalan sudah menunjukkan prosesnya, jadi titik loading disembunyikan
  const working = last?.who === 'action' && actionOf(last)?.status === 'running'
  const cardHost = waiting && !typing && last && last.who === 'ai' && last.parts?.next ? last.id : null
  const chips = waiting && (
    <div className="chips chatcard__chips" key={waiting.step}>
      <button type="button" className="chip chip--toggle" onClick={() => answer(waiting.yes.say)}>
        {waiting.yes.label}
      </button>
      <button type="button" className="chip chip--toggle" onClick={() => answer(waiting.no.say)}>
        {waiting.no.label}
      </button>
    </div>
  )


  return (
    <section className="voicecard chatcard" aria-label="Chat with the assistant">
      {inCall && <CallBar call={call} onOpen={onVoice} onMute={onMute} onEnd={onEnd} />}

      <div className="chatcard__log" role="log" aria-live="polite" ref={logRef}>
        {shown.map((m, i) => {
          const prev = shown[i - 1]
          return (
            <div key={m.id} className={`chatcard__item ${m.leaving ? 'is-leaving' : ''}`}>
              {prev && prev.via !== m.via && m.who !== 'tab' && (
                <p className="chatdiv">{m.via === 'voice' ? 'Voice call' : 'Chat'}</p>
              )}
              {m.who === 'tab' ? (
                // Pindah tab di mode Chat: pemisah nama tab, gayanya sama dengan pemisah Voice call / Chat
                <p className={`chatdiv ${m.id > mountMax ? 'is-new' : ''}`}>{m.text}</p>
              ) : m.who === 'action' ? (
                actionOf(m) && <ChatAction item={actionOf(m)} isNew={m.id > mountMax} onUndo={onUndo} onToast={onToast} />
              ) : m.who === 'user' ? (
                <p className={`chatmsg chatmsg--user ${m.id > mountMax ? 'is-new' : ''}`}>{m.text}</p>
              ) : m.who === 'note' ? (
                <p className={`chatmsg chatmsg--note ${m.id > mountMax ? 'is-new' : ''}`}>
                  <span className="voicecard__who">Note</span>
                  {m.text}
                </p>
              ) : speakingNow(m) ? (
                <p className="chatmsg">
                  <span className="sr-only">{m.text}</span>
                  <span aria-hidden="true">
                    {m.text.slice(0, spoken.n)}
                    <span className="chatmsg__unspoken">{m.text.slice(spoken.n)}</span>
                  </span>
                </p>
              ) : m.parts ? (
                <AiMessage
                  m={m}
                  animate={streams(m)}
                  skip={doneIds.has(m.id) || m.id <= skipAll}
                  active={cardHost === m.id}
                  chips={chips}
                  onTick={scrollToEnd}
                  onDone={() => markDone(m.id)}
                />
              ) : streams(m) ? (
                <p className="chatmsg">
                  <StreamText
                    text={m.text}
                    skip={doneIds.has(m.id) || m.id <= skipAll}
                    onTick={scrollToEnd}
                    onDone={() => markDone(m.id)}
                  />
                </p>
              ) : (
                <p className={`chatmsg ${m.id > mountMax ? 'is-new' : ''}`}>{m.text}</p>
              )}
            </div>
          )
        })}

        {typing && !working && (
          <p className="chatdots" role="status" aria-label="Assistant is typing">
            {/* Efek gooey: blur lalu dipertajam lagi, jadi dua titik yang berdekatan melebur seperti cairan */}
            <svg className="chatdots__defs" aria-hidden="true" focusable="false">
              <filter id="chatdots-goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>
            </svg>
            <span className="chatdots__blobs" aria-hidden="true">
              <span />
              <span />
            </span>
          </p>
        )}

        {/* Pertanyaan dari transkrip call (tanpa bagian terpisah): chip di bawah percakapan */}
        {waiting && !typing && !streaming && !cardHost && chips}
      </div>

      <form className="composer" onSubmit={submit}>
        <input
          className="composer__input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={inCall ? 'Type during the call' : 'Ask about your shop'}
          aria-label="Message the assistant"
        />
        {!inCall && (
          <button type="button" className="composer__btn" aria-label="Switch to voice" onClick={onVoice}>
            <MicIcon size={19} />
          </button>
        )}
        <button type="submit" className="composer__btn composer__btn--send" aria-label="Send" disabled={!text.trim()}>
          <SendIcon size={17} />
        </button>
      </form>
    </section>
  )
}
