import { ExternalIcon, WaveIcon, DoubleCheckIcon } from '../icons.jsx'

export const AI_MODES = [
  { id: 'brief', title: 'Brief answers', desc: 'Quick answers about orders, chats, and stock' },
  { id: 'think', title: 'Think it through', desc: 'AI asks and weighs options' },
  { id: 'guide', title: 'Guide me', desc: 'Step by step help running your shop' },
  { id: 'listen', title: 'Listen only', desc: 'AI stays quiet, writes notes' },
]

function Toggle({ on, onChange, label }) {
  return (
    <button
      className={`toggle ${on ? 'is-on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <span className="toggle__knob" />
    </button>
  )
}

export const VOICE_LANGS = [
  { id: 'en', label: 'English' },
  { id: 'id', label: 'Bahasa Indonesia' },
]

export default function SettingsPanel({
  voiceLang,
  setVoiceLang,
  aiMode,
  setAiMode,
  liveCaptions,
  setLiveCaptions,
  askFirst,
  setAskFirst,
  showVoice = true, // pengaturan khusus voice tampil di mode Voice atau saat call berjalan
  onToast,
}) {
  // Listen only tidak berlaku di chat: chat memakai Brief answers
  const shownMode = !showVoice && aiMode === 'listen' ? 'brief' : aiMode
  const modes = showVoice ? AI_MODES : AI_MODES.filter((m) => m.id !== 'listen')
  return (
    <div className="settings">
      <div className="settings__head">
        <div>
          <h2 className="settings__title">Assistant settings</h2>
          <button
            className="settings__link"
            onClick={() => onToast('Full assistant settings are coming soon')}
          >
            All assistant settings <ExternalIcon size={12} />
          </button>
        </div>
        {showVoice && (
          <button
            className="settings__wave"
            aria-label="Play voice preview"
            onClick={() => onToast('Playing a short voice preview...')}
          >
            <WaveIcon size={18} />
          </button>
        )}
      </div>

      <h3 className="settings__label">Language</h3>
      <div className="seg" role="radiogroup" aria-label="Language">
        {VOICE_LANGS.map((l) => (
          <button
            key={l.id}
            role="radio"
            aria-checked={voiceLang === l.id}
            className={`seg__btn ${voiceLang === l.id ? 'is-active' : ''}`}
            onClick={() => setVoiceLang(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <h3 className="settings__label">AI Mode</h3>
      <div className="modes" role="radiogroup" aria-label="AI mode">
        {modes.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={shownMode === m.id}
            className={`mode ${shownMode === m.id ? 'is-active' : ''}`}
            onClick={() => setAiMode(m.id)}
          >
            <span className="mode__text">
              <span className="mode__title">{m.title}</span>
              <span className="mode__desc">{m.desc}</span>
            </span>
            {shownMode === m.id && (
              <span className="mode__check">
                <DoubleCheckIcon size={16} />
              </span>
            )}
          </button>
        ))}
      </div>

      <h3 className="settings__label">Quick Settings</h3>
      <div className="quick">
        <div className="quick__row">
          <span className="quick__chip">Ask Me First</span>
          <Toggle on={askFirst} onChange={setAskFirst} label="Ask me first" />
        </div>
        {showVoice && (
          <div className="quick__row">
            <span className="quick__chip">Live Captions</span>
            <Toggle on={liveCaptions} onChange={setLiveCaptions} label="Live captions" />
          </div>
        )}
      </div>
    </div>
  )
}
