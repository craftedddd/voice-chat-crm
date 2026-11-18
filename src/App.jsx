import { useCallback, useEffect, useState } from 'react'
import { IconRail, NavPanel } from './components/NavSide.jsx'
import VoiceCard from './components/VoiceCard.jsx'
import SidePanel from './components/SidePanel.jsx'
import { PlusIcon, MenuIcon, CloseIcon, CogIcon } from './icons.jsx'
import useVoiceChat from './voice/useVoiceChat.js'
import { BRIEFINGS } from './voice/brain.js'
import { Toaster, useToaster } from './components/Toast.jsx'
import BottomSheet from './components/BottomSheet.jsx'

const TABS = ['Everything', 'Deals', 'Contacts', 'Tasks']

export default function App() {
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

  // Bottom sheet Voice Settings (hanya mobile, dibuka lewat ikon gear)
  const [sheetOpen, setSheetOpen] = useState(false)
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 641px)')
    const onChange = () => mq.matches && setSheetOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Toast: satu pill beranimasi di atas area konten
  const toaster = useToaster()
  const showToast = toaster.api.show

  // Panel kanan: Settings | Actions
  const [panelTab, setPanelTab] = useState('settings')

  // Toast aksi hanya muncul kalau feed Live actions sedang tidak terlihat di layar
  const isFeedVisible = useCallback(
    () =>
      [...document.querySelectorAll('.afeed')].some((el) => {
        if (!el.offsetParent) return false
        const b = el.getBoundingClientRect()
        return b.height > 0 && b.bottom > 0 && b.top < window.innerHeight
      }),
    []
  )

  // Voice chat sungguhan (mic + pengenalan suara + suara balasan)
  const voice = useVoiceChat({ tab: activeTab, aiMode, askFirst, onToast: showToast, isFeedVisible })

  // Saat sesi dimulai, panel pindah ke Actions (sekali per sesi; pilihan user setelahnya dihormati)
  useEffect(() => {
    if (voice.status === 'connecting') setPanelTab('actions')
  }, [voice.status])

  const phase =
    voice.status === 'idle' ? (voice.feed.length ? 'last' : 'idle') : voice.status === 'ended' ? 'last' : 'live'

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

  const feedProps = {
    phase,
    feed: voice.feed,
    waiting: voice.waiting,
    seconds: voice.seconds,
    listenOnly: aiMode === 'listen',
    onAnswer: voice.answer,
    onUndo: voice.undo,
    onToast: showToast,
  }
  const panelProps = { tab: panelTab, setTab: setPanelTab, settingsProps, feedProps }
  const openSheet = (tab) => {
    setPanelTab(tab)
    setSheetOpen(true)
  }

  // Pertanyaan yang menunggu jawaban jadi toast yang tetap tampil, kecuali feed Actions sedang terlihat.
  // Di mobile feed hanya terlihat kalau sheet terbuka di tab Actions; di layar lebih besar dicek dari DOM.
  const { waiting, answer } = voice
  useEffect(() => {
    const api = toaster.api
    const mobile = window.matchMedia('(max-width: 640px)').matches
    const feedOnScreen = mobile ? sheetOpen && panelTab === 'actions' : panelTab === 'actions' && isFeedVisible()
    if (!waiting || feedOnScreen) {
      api.setSticky(null)
      return
    }
    api.setSticky({
      kind: 'ask',
      text: waiting.title,
      key: `ask:${waiting.step}`,
      action: { label: waiting.yes.label, onClick: () => answer(waiting.yes.say) },
      onTap: () => {
        setPanelTab('actions')
        if (mobile) setSheetOpen(true)
      },
    })
  }, [waiting, answer, sheetOpen, panelTab, isFeedVisible, toaster.api])

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
          <button
            className="iconbtn main__gear"
            aria-label="Voice settings"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            onClick={() => openSheet('settings')}
          >
            <CogIcon size={21} />
          </button>
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
          <button className="tab tab--plus" aria-label="Add context" onClick={() => showToast('Custom contexts are coming soon')}>
            <PlusIcon size={15} />
          </button>
        </div>

        <div className="content">
          <VoiceCard
            status={voice.status}
            muted={voice.muted}
            seconds={voice.seconds}
            caption={voice.caption}
            notes={voice.notes}
            summary={voice.summary}
            supported={voice.supported}
            listenOnly={aiMode === 'listen'}
            liveCaptions={liveCaptions}
            briefing={BRIEFINGS[activeTab]}
            getLevel={voice.getLevel}
            onStart={voice.start}
            onToggleMute={voice.toggleMute}
            onEnd={voice.end}
            onInvite={() => showToast('Inviting teammates is coming soon')}
            onToast={showToast}
            working={voice.working}
          />

          <aside className="sidecol">
            <SidePanel {...panelProps} />
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

      {/* Voice Settings sebagai bottom sheet (mobile) */}
      <BottomSheet open={sheetOpen} onClose={closeSheet} label={panelTab === 'actions' ? 'Live actions' : 'Voice settings'}>
        <SidePanel {...panelProps} />
      </BottomSheet>

      <Toaster {...toaster} />
    </div>
  )
}
