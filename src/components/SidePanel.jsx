import SettingsPanel from './SettingsPanel.jsx'
import ActionFeed from './ActionFeed.jsx'

/** Kolom kanan: Voice Settings dan Live actions dalam satu panel bertab. */
export default function SidePanel({ tab, setTab, settingsProps, feedProps }) {
  const count = feedProps.feed.filter((x) => x.status !== 'undone').length
  const alert = !!feedProps.waiting

  return (
    <div className="spanel">
      <div className="seg spanel__seg" role="tablist" aria-label="Panel">
        <button
          role="tab"
          aria-selected={tab === 'settings'}
          className={`seg__btn ${tab === 'settings' ? 'is-active' : ''}`}
          onClick={() => setTab('settings')}
        >
          Settings
        </button>
        <button
          role="tab"
          aria-selected={tab === 'actions'}
          className={`seg__btn ${tab === 'actions' ? 'is-active' : ''}`}
          onClick={() => setTab('actions')}
        >
          Actions
          {(count > 0 || alert) && (
            <span className={`seg__badge ${alert ? 'is-alert' : ''}`} key={`${count}:${alert}`}>
              {alert ? count + 1 : count}
            </span>
          )}
          {alert && <span className="sr-only"> (one needs your OK)</span>}
        </button>
      </div>

      <div className="spanel__body" role="tabpanel" key={tab}>
        {tab === 'settings' ? <SettingsPanel {...settingsProps} /> : <ActionFeed {...feedProps} />}
      </div>
    </div>
  )
}
