import { useEffect, useRef, useState } from 'react'
import { IconRail, NavPanel } from './components/NavSide.jsx'
import VoiceCard from './components/VoiceCard.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { PlusIcon, MenuIcon, CloseIcon } from './icons.jsx'

const TABS = ['Everything', 'Deals', 'Contacts', 'Tasks']

const TRANSCRIPTS = {
  Everything: {
    lead: 'You have three deals waiting on a reply. The biggest is Acme Co., worth $12,000',
    tail: ', with no reply for nine days....',
  },
  Deals: {
    lead: 'Pipeline looks healthy this week. Four deals moved into negotiation',
    tail: ', and Northwind is ready for a proposal....',
  },
  Contacts: {
    lead: 'You added six new contacts from the webinar. Two of them opened your follow-up',
    tail: ' email earlier this morning....',
  },
  Tasks: {
    lead: 'Eight tasks are due today. Three are quick calls you could finish',
    tail: ' before your lunch break....',
  },
}

const START_SECONDS = 13 * 60 + 29 // 13:29, sama seperti mockup

export default function App() {
  // Sesi voice chat
  const [seconds, setSeconds] = useState(START_SECONDS)
  const [muted, setMuted] = useState(false)
  const [ended, setEnded] = useState(false)

  // Konten & pengaturan
  const [activeTab, setActiveTab] = useState('Everything')
  const [aiMode, setAiMode] = useState('brief')
  const [liveCaptions, setLiveCaptions] = useState(true)
  const [askFirst, setAskFirst] = useState(true)

  // Navigasi kiri
  const [audience, setAudience] = useState('Personal')
  const [query, setQuery] = useState('')
  const [activeNav, setActiveNav] = useState('assistant')
  const [prefsOpen, setPrefsOpen] = useState(true)

  // Drawer navigasi untuk layar kecil
  const [navOpen, setNavOpen] = useState(false)

  // Toast kecil untuk aksi di luar cakupan demo
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const showToast = (msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }

  // Timer berjalan selama sesi aktif
  useEffect(() => {
    if (ended) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [ended])

  // Tutup drawer dengan tombol Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const navPanelProps = {
    audience,
    setAudience,
    query,
    setQuery,
    activeNav,
    setActiveNav: (id) => {
      setActiveNav(id)
      setNavOpen(false)
    },
    prefsOpen,
    setPrefsOpen,
    onToast: showToast,
  }

  const settingsProps = {
    aiMode,
    setAiMode,
    liveCaptions,
    setLiveCaptions,
    askFirst,
    setAskFirst,
    onToast: showToast,
  }

  return (
    <div className="app">
      <IconRail activeRail="ai" onRail={() => {}} onToast={showToast} />

      <div className="navcol">
        <NavPanel {...navPanelProps} />
      </div>

      <main className="main">
        <header className="main__header">
          <button className="iconbtn main__menu" aria-label="Open menu" onClick={() => setNavOpen(true)}>
            <MenuIcon size={18} />
          </button>
          <h1 className="main__title">Voice Chat</h1>
          <p className="main__subtitle">Ask questions, talk through a deal, or get help using the CRM</p>
        </header>

        <div className="tabs" role="tablist" aria-label="Voice chat context">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={activeTab === t}
              className={`tab ${activeTab === t ? 'is-active' : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
          <button className="tab tab--plus" aria-label="Add context" onClick={() => showToast('Adding a custom context is outside this demo')}>
            <PlusIcon size={15} />
          </button>
        </div>

        <div className="content">
          <VoiceCard
            seconds={seconds}
            muted={muted}
            ended={ended}
            liveCaptions={liveCaptions}
            transcript={TRANSCRIPTS[activeTab]}
            onToggleMute={() => setMuted((m) => !m)}
            onEnd={() => setEnded(true)}
            onRestart={() => {
              setSeconds(0)
              setMuted(false)
              setEnded(false)
            }}
            onInvite={() => showToast('Inviting teammates is outside this demo')}
          />

          <aside className="sidecol">
            <SettingsPanel {...settingsProps} />
          </aside>
        </div>
      </main>

      {/* Drawer navigasi (layar kecil) */}
      {navOpen && (
        <div className="drawer-root" onClick={() => setNavOpen(false)}>
          <div className="drawer drawer--left" onClick={(e) => e.stopPropagation()}>
            <button className="drawer__close" aria-label="Close menu" onClick={() => setNavOpen(false)}>
              <CloseIcon size={18} />
            </button>
            <NavPanel {...navPanelProps} />
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
