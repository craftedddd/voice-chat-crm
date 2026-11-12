import { MicIcon, MicOffIcon, CloseIcon, UserPlusIcon } from '../icons.jsx'
import Orb from './Orb.jsx'
import SessionSummary from './SessionSummary.jsx'

function formatTime(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const WHO_LABEL = { user: 'You', ai: 'Assistant', note: 'Note saved' }

export default function VoiceCard({
  status,
  muted,
  seconds,
  caption,
  notes,
  summary,
  supported,
  listenOnly,
  liveCaptions,
  briefing,
  getLevel,
  onStart,
  onToggleMute,
  onEnd,
  onInvite,
  onToast,
}) {
  const active = status === 'connecting' || status === 'listening' || status === 'thinking' || status === 'speaking'
  const ended = status === 'ended'
  const idle = status === 'idle'

  // Sesi selesai: kartu berubah menjadi ringkasan sesi
  if (ended && summary) {
    return (
      <section className="voicecard voicecard--summary" aria-label="Voice chat summary">
        <SessionSummary key={summary.id} summary={summary} onRestart={onStart} onToast={onToast} />
      </section>
    )
  }

  const orbState = ended
    ? 'ended'
    : muted && active && status === 'listening'
      ? 'muted'
      : status === 'connecting'
        ? 'thinking'
        : status

  let label
  if (ended) label = 'Call ended'
  else if (idle) label = supported ? 'Tap the mic to start' : 'Voice not supported in this browser'
  else if (status === 'connecting') label = 'Connecting...'
  else if (status === 'speaking') label = 'Speaking...'
  else if (status === 'thinking') label = 'Thinking...'
  else if (muted) label = 'Muted'
  else label = listenOnly ? 'Listening, taking notes...' : 'Listening...'

  let body
  if (ended) {
    body = (
      <p className="voicecard__captions voicecard__captions--off">
        {notes > 0
          ? `Voice chat ended. ${notes} ${notes === 1 ? 'note was' : 'notes were'} captured in this demo.`
          : 'Voice chat ended. Tap the mic to start a new one.'}
      </p>
    )
  } else if (!liveCaptions) {
    body = (
      <p className="voicecard__captions voicecard__captions--off">
        Live captions are off. Turn them on in Quick Settings to read along.
      </p>
    )
  } else if (idle) {
    body = (
      <p className="voicecard__captions" key={briefing.lead}>
        <span className="t-lead">{briefing.lead}</span>
        <span className="t-tail">{briefing.tail}</span>
      </p>
    )
  } else if (caption) {
    body = (
      <div className="voicecard__captionwrap" key={caption.who}>
        <div className="voicecard__who">{WHO_LABEL[caption.who]}</div>
        <p className="voicecard__captions voicecard__captions--live">
          <span className="t-lead">{caption.lead}</span>
          <span className="t-tail">{caption.tail}</span>
        </p>
      </div>
    )
  } else {
    body = (
      <p className="voicecard__captions voicecard__captions--off">
        {muted ? 'Mic is muted. Tap the mic to talk.' : "Go ahead, I'm listening."}
      </p>
    )
  }

  return (
    <section className="voicecard" aria-label="Voice chat session">
      <div className="voicecard__top">
        <Orb state={orbState} getLevel={getLevel} />
        <div className="voicecard__timer">{formatTime(seconds)}</div>
      </div>

      <div className="voicecard__middle" aria-live="polite">
        {body}
      </div>

      <div className="voicecard__bottom">
        <div className={`voicecard__status ${ended || idle ? 'is-ended' : ''}`}>{label}</div>

        <div className="controls">
          <button className="ctl" onClick={onInvite} aria-label="Add someone to the call">
            <UserPlusIcon size={20} />
          </button>

          <div className={`mic-wrap ${active && muted ? 'is-muted' : ''}`}>
            {active ? (
              <button
                className="ctl ctl--mic"
                onClick={onToggleMute}
                aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                aria-pressed={muted}
              >
                {muted ? <MicIcon size={22} /> : <MicOffIcon size={22} />}
              </button>
            ) : (
              <button
                className="ctl ctl--mic ctl--start"
                onClick={onStart}
                aria-label={ended ? 'Start a new voice chat' : 'Start voice chat'}
              >
                <MicIcon size={22} />
              </button>
            )}
          </div>

          <button className="ctl" onClick={onEnd} disabled={!active} aria-label="End voice chat">
            <CloseIcon size={20} />
          </button>
        </div>
      </div>
    </section>
  )
}
