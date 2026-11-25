import { useCallback, useEffect, useRef, useState } from 'react'
import { IconRail, NavPanel, MainMenu } from './components/NavSide.jsx'
import VoiceCard from './components/VoiceCard.jsx'
import SidePanel from './components/SidePanel.jsx'
import { MenuIcon, CloseIcon, CogIcon } from './icons.jsx'
import useVoiceChat from './voice/useVoiceChat.js'
import { briefingFor } from './voice/brain.js'
import { Toaster, useToaster } from './components/Toast.jsx'
import BottomSheet from './components/BottomSheet.jsx'
import ContextTabs from './components/ContextTabs.jsx'
import ContextEditor from './components/ContextEditor.jsx'
import ChatCard from './components/ChatCard.jsx'

const BUILTIN_TABS = ['Everything', 'Orders', 'Chats', 'Stock']
const MAX_CUSTOM = 3

// Custom context dan urutan tab disimpan di browser. Kalau storage tidak bisa dipakai, app tetap jalan.
function useStored(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* abaikan */
    }
  }, [key, value])
  return [value, setValue]
}

function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatch(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return match
}

const MODES = [
  ['chat', 'Chat'],
  ['voice', 'Voice'],
]

/** Switch Chat | Voice (segmented control). Dirender dua kali: di header (mobile) dan di baris tab (desktop). */
function ModeSwitch({ mode, onChange, className }) {
  return (
    <div className={`seg modeswitch ${className}`} role="radiogroup" aria-label="Assistant mode">
      {MODES.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mode === id}
          className={`seg__btn ${mode === id ? 'is-active' : ''}`}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  // Konten & pengaturan
  const [activeTab, setActiveTab] = useState('Everything') // id tab: nama tab bawaan atau id custom
  const [contexts, setContexts] = useStored('nara.contexts', []) // { id, name, focus, shop, products }
  const [tabOrder, setTabOrder] = useStored('nara.tabOrder', BUILTIN_TABS)
  const [editorFor, setEditorFor] = useState(null) // 'new' | id custom context | null
  const mobile = useMedia('(max-width: 640px)')
  const [aiMode, setAiMode] = useState('brief')
  const [mode, setMode] = useStored('nara.mode', 'voice') // Chat | Voice
  const [liveCaptions, setLiveCaptions] = useState(true)
  const [askFirst, setAskFirst] = useState(true)
  const [voiceLang, setVoiceLang] = useState('en') // bahasa percakapan suara, UI tetap bahasa Inggris

  // Navigasi kiri
  const [audience, setAudience] = useState('Personal')
  const [query, setQuery] = useState('')
  const [activeNav, setActiveNav] = useState('assistant')
  const [prefsOpen, setPrefsOpen] = useState(true)

  // Drawer navigasi untuk layar kecil
  const [navOpen, setNavOpen] = useState(false)
  // Isi drawer: panel AI (default) atau menu utama. Arah dipakai untuk animasi geser.
  const [drawerView, setDrawerView] = useState({ id: 'ai', from: null })
  const drawerRef = useRef(null)

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

  // Tab context: bawaan + custom, mengikuti urutan yang disimpan
  const tabs = (() => {
    const all = [...BUILTIN_TABS.map((id) => ({ id, label: id })), ...contexts.map((c) => ({ id: c.id, label: c.name, custom: true }))]
    const rank = (id) => {
      const i = tabOrder.indexOf(id)
      return i === -1 ? tabOrder.length + all.findIndex((t) => t.id === id) : i
    }
    return all.sort((a, b) => rank(a.id) - rank(b.id))
  })()
  const activeCtx = contexts.find((c) => c.id === activeTab) || (BUILTIN_TABS.includes(activeTab) ? activeTab : 'Everything')
  const editing = editorFor && editorFor !== 'new' ? contexts.find((c) => c.id === editorFor) : null

  const addContext = () => {
    if (editorFor === 'new') return setEditorFor(null)
    if (contexts.length >= MAX_CUSTOM) {
      showToast({ kind: 'info', text: `You can have up to ${MAX_CUSTOM} custom contexts` })
      return
    }
    setEditorFor('new')
  }

  const saveContext = (def) => {
    if (def.id) {
      setContexts((cs) => cs.map((c) => (c.id === def.id ? def : c)))
    } else {
      const id = `c${Date.now().toString(36)}`
      setContexts((cs) => [...cs, { ...def, id }])
      setTabOrder(tabs.map((t) => t.id).concat(id))
      setActiveTab(id)
    }
    setEditorFor(null)
  }

  // Hapus custom context, bisa dibatalkan lewat Undo di toast
  const deleteContext = (id) => {
    const ctx = contexts.find((c) => c.id === id)
    if (!ctx) return
    const ids = tabs.map((t) => t.id)
    const at = ids.indexOf(id)
    setContexts((cs) => cs.filter((c) => c.id !== id))
    setTabOrder(ids.filter((x) => x !== id))
    if (activeTab === id) setActiveTab('Everything')
    setEditorFor(null)
    showToast({
      kind: 'info',
      text: `${ctx.name} deleted`,
      key: `ctx-del:${id}`,
      action: {
        label: 'Undo',
        onClick: () => {
          setContexts((cs) => (cs.some((c) => c.id === id) ? cs : [...cs, ctx]))
          setTabOrder((o) => {
            const rest = o.filter((x) => x !== id)
            return [...rest.slice(0, at), id, ...rest.slice(at)]
          })
        },
        after: { text: `${ctx.name} restored` },
      },
    })
  }

  // Isi sheet terakhir dipertahankan selama animasi menutup
  const lastEditor = useRef(null)
  const editorNode = editorFor ? (
    <ContextEditor
      key={editorFor}
      initial={editing}
      lang={voiceLang}
      takenNames={contexts.filter((c) => c.id !== editorFor).map((c) => c.name)}
      onSave={saveContext}
      onDelete={() => deleteContext(editorFor)}
      onCancel={() => setEditorFor(null)}
    />
  ) : null
  if (editorNode) lastEditor.current = editorNode

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
  const voice = useVoiceChat({
    tab: activeCtx,
    aiMode,
    askFirst,
    voiceLang,
    onToast: showToast,
    isFeedVisible,
    // Di HP mode Chat, kartu aksi tampil di percakapan, jadi toast aksi tidak perlu
    actionsInChat: mode === 'chat' && mobile,
  })

  // Saat sesi dimulai, panel pindah ke Actions (sekali per sesi; pilihan user setelahnya dihormati)
  useEffect(() => {
    if (voice.status === 'connecting') setPanelTab('actions')
  }, [voice.status])

  const callLive = voice.status !== 'idle' && voice.status !== 'ended'
  const phase = callLive || (mode === 'chat' && voice.feed.length) ? 'live' : voice.feed.length ? 'last' : 'idle'

  // Mode di <html>: di HP, latar di belakang toolbar browser ikut warna mode (Chat putih, Voice gradien)
  useEffect(() => {
    document.documentElement.dataset.mode = mode
  }, [mode])

  // Tutup drawer dengan tombol Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Drawer selalu dibuka di panel AI
  useEffect(() => {
    if (navOpen) setDrawerView({ id: 'ai', from: null })
  }, [navOpen])

  // Setelah pindah isi drawer, fokus ke judul baru (untuk keyboard dan screen reader)
  useEffect(() => {
    if (drawerView.from) drawerRef.current?.querySelector('[data-autofocus]')?.focus()
  }, [drawerView])

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
    voiceLang,
    setVoiceLang,
    aiMode,
    setAiMode,
    liveCaptions,
    setLiveCaptions,
    askFirst,
    setAskFirst,
    showVoice: mode === 'voice' || callLive,
    onToast: showToast,
  }

  const feedProps = {
    phase,
    feed: voice.feed,
    waiting: voice.waiting,
    seconds: voice.seconds,
    listenOnly: aiMode === 'listen',
    onAnswer: voice.answer,
    onToggleOrder: voice.toggleOrder,
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
    // Di mode Chat chip jawabannya ada di percakapan; tanpa call, pertanyaan dari chat tidak perlu toast
    if (!waiting || feedOnScreen || mode === 'chat' || !callLive) {
      api.setSticky(null)
      return
    }
    const openFeed = () => {
      setPanelTab('actions')
      if (mobile) setSheetOpen(true)
      // Layar sedang: panel ditumpuk di bawah kartu, jadi gulir sampai feed terlihat
      else requestAnimationFrame(() => document.querySelector('.spanel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    }
    api.setSticky({
      kind: 'ask',
      text: waiting.title,
      key: `ask:${waiting.step}`,
      // Label pengiriman: daftarnya harus dilihat dulu, jadi tombolnya membuka feed Actions
      action: waiting.orders
        ? { label: 'Review', onClick: openFeed }
        : { label: waiting.yes.label, onClick: () => answer(waiting.yes.say) },
      onTap: openFeed,
    })
  }, [waiting, answer, sheetOpen, panelTab, isFeedVisible, toaster.api, mode, callLive])

  return (
    <div className={`app ${mode === 'chat' ? 'is-chat' : ''}`}>
      <IconRail activeRail="ai" onRail={() => {}} onToast={showToast} />

      <div className="navcol">
        <NavPanel {...navPanelProps} />
      </div>

      <main className="main">
        <header className="main__header">
          <button className="iconbtn main__menu" aria-label="Open menu" onClick={() => setNavOpen(true)}>
            <MenuIcon size={18} />
          </button>
          <h1 className="main__title">Assistant</h1>
          <ModeSwitch mode={mode} onChange={setMode} className="main__mode" />
          <button
            className="iconbtn main__gear"
            aria-label="Assistant settings"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            onClick={() => openSheet('settings')}
          >
            <CogIcon size={21} />
          </button>
          <p className="main__subtitle">Run your Shopee and TikTok Shop by chat or voice</p>
        </header>

        {/* Desktop: switch Chat | Voice di kiri, garis pemisah, lalu tab context */}
        <div className="ctxbar">
          <ModeSwitch mode={mode} onChange={setMode} className="ctxbar__mode" />
          <span className="ctxbar__divider" aria-hidden="true" />
          <ContextTabs
            tabs={tabs}
            activeId={typeof activeCtx === 'string' ? activeCtx : activeCtx.id}
            onSelect={(id) => {
              setActiveTab(id)
              setEditorFor(null)
            }}
            onEdit={(id) => setEditorFor(editorFor === id ? null : id)}
            onAdd={addContext}
            onReorder={setTabOrder}
            onDelete={deleteContext}
            editorFor={editorFor}
            editor={mobile ? null : editorNode}
            onCloseEditor={() => setEditorFor(null)}
          />
        </div>

        <div className="content">
          {mode === 'chat' ? (
            <ChatCard
              messages={voice.messages}
              feed={voice.feed}
              inlineActions={mobile}
              onUndo={voice.undo}
              onToast={showToast}
              typing={voice.typing}
              waiting={voice.waiting}
              call={{ status: voice.status, seconds: voice.seconds, muted: voice.muted }}
              onOpenChat={voice.openChat}
              spoken={voice.spoken}
              onSend={voice.send}
              onAnswer={voice.answer}
              onToggleOrder={voice.toggleOrder}
              onVoice={() => setMode('voice')}
              onMute={voice.toggleMute}
              onEnd={voice.end}
            />
          ) : (
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
              briefing={
                voice.resume
                  ? { label: 'Continuing from chat', lead: voice.resume, tail: '' }
                  : briefingFor(voiceLang, activeCtx)
              }
              getLevel={voice.getLevel}
              onStart={voice.start}
              onToggleMute={voice.toggleMute}
              onEnd={voice.end}
              onInvite={() => showToast('Inviting teammates is coming soon')}
              onToast={showToast}
              working={voice.working}
            />
          )}

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
            <div
              key={drawerView.id}
              className={`drawer__view ${drawerView.from ? `drawer__view--from-${drawerView.from}` : ''}`}
              ref={drawerRef}
            >
              {drawerView.id === 'main' ? (
                <MainMenu
                  activeRail="ai"
                  onOpen={() => setDrawerView({ id: 'ai', from: 'right' })}
                  onToast={(text) => {
                    setNavOpen(false)
                    showToast(text)
                  }}
                />
              ) : (
                <NavPanel {...navPanelProps} onBack={() => setDrawerView({ id: 'main', from: 'left' })} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Settings sebagai bottom sheet (mobile) */}
      <BottomSheet open={sheetOpen} onClose={closeSheet} label={panelTab === 'actions' ? 'Live actions' : 'Assistant settings'}>
        <SidePanel {...panelProps} />
      </BottomSheet>

      {/* Editor custom context sebagai bottom sheet (mobile) */}
      <BottomSheet
        open={mobile && !!editorFor}
        onClose={() => setEditorFor(null)}
        label={editorFor === 'new' ? 'New context' : 'Edit context'}
      >
        {mobile && (editorNode || lastEditor.current)}
      </BottomSheet>

      <Toaster {...toaster} />
    </div>
  )
}
