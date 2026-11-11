import { ExternalIcon, WaveIcon, DoubleCheckIcon } from '../icons.jsx'

export const AI_MODES = [
  { id: 'brief', title: 'Brief answers', desc: 'Get answers about your customers and deals' },
  { id: 'think', title: 'Think it through', desc: 'AI asks and weighs options' },
  { id: 'guide', title: 'Guide me', desc: 'Step by step help in the CRM' },
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

export default function SettingsPanel({
  aiMode,
  setAiMode,
  liveCaptions,
  setLiveCaptions,
  askFirst,
  setAskFirst,
  onToast,
}) {
  return (
    <div className="settings">
      <div className="settings__head">
        <div>
          <h2 className="settings__title">Voice Settings</h2>
          <button
            className="settings__link"
            onClick={() => onToast('The full voice settings page is outside this demo')}
          >
            All voice settings <ExternalIcon size={12} />
          </button>
        </div>
        <button
          className="settings__wave"
          aria-label="Play voice preview"
          onClick={() => onToast('Playing a short voice preview...')}
        >
          <WaveIcon size={18} />
        </button>
      </div>

      <h3 className="settings__label">AI Mode</h3>
      <div className="modes" role="radiogroup" aria-label="AI mode">
        {AI_MODES.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={aiMode === m.id}
            className={`mode ${aiMode === m.id ? 'is-active' : ''}`}
            onClick={() => setAiMode(m.id)}
          >
            <span className="mode__text">
              <span className="mode__title">{m.title}</span>
              <span className="mode__desc">{m.desc}</span>
            </span>
            {aiMode === m.id && (
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
          <span className="quick__chip">Live Captions</span>
          <Toggle on={liveCaptions} onChange={setLiveCaptions} label="Live captions" />
        </div>
        <div className="quick__row">
          <span className="quick__chip">Ask Me First</span>
          <Toggle on={askFirst} onChange={setAskFirst} label="Ask me first" />
        </div>
      </div>
    </div>
  )
}
