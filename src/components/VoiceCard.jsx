import { MicIcon, MicOffIcon, CloseIcon, UserPlusIcon } from '../icons.jsx'

function formatTime(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VoiceCard({
  seconds,
  muted,
  ended,
  liveCaptions,
  transcript,
  onToggleMute,
  onEnd,
  onRestart,
  onInvite,
}) {
  const status = ended ? 'Call ended' : muted ? 'Muted' : 'Speaking...'

  return (
    <section className="voicecard" aria-label="Voice chat session">
      <div className="voicecard__top">
        <div className={`orb ${ended ? 'is-ended' : muted ? 'is-muted' : 'is-speaking'}`}>
          <div className="orb__blobs">
            <span className="orb__blob orb__blob--violet" />
            <span className="orb__blob orb__blob--pink" />
            <span className="orb__blob orb__blob--blue" />
            <span className="orb__blob orb__blob--veil" />
          </div>
          <div className="orb__glass" />
        </div>
        <div className="voicecard__timer">{formatTime(seconds)}</div>
      </div>

      <div className="voicecard__middle">
        {ended ? (
          <p className="voicecard__captions voicecard__captions--off">
            Voice chat ended. A summary note was saved to your activity.
          </p>
        ) : liveCaptions ? (
          <p className="voicecard__captions" key={transcript.lead}>
            <span className="t-lead">{transcript.lead}</span>
            <span className="t-tail">{transcript.tail}</span>
          </p>
        ) : (
          <p className="voicecard__captions voicecard__captions--off">
            Live captions are off. Turn them on in Quick Settings to read along.
          </p>
        )}
      </div>

      <div className="voicecard__bottom">
        <div className={`voicecard__status ${ended ? 'is-ended' : ''}`}>{status}</div>

        {ended ? (
          <div className="controls controls--center">
            <button className="ctl ctl--primary" onClick={onRestart} aria-label="Start a new voice chat">
              <MicIcon size={22} />
            </button>
          </div>
        ) : (
          <div className="controls">
            <button className="ctl" onClick={onInvite} aria-label="Add someone to the call">
              <UserPlusIcon size={20} />
            </button>
            <div className={`mic-wrap ${muted ? 'is-muted' : ''}`}>
              <button
                className="ctl ctl--mic"
                onClick={onToggleMute}
                aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                aria-pressed={muted}
              >
                {muted ? <MicIcon size={22} /> : <MicOffIcon size={22} />}
              </button>
            </div>
            <button className="ctl" onClick={onEnd} aria-label="End voice chat">
              <CloseIcon size={20} />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
