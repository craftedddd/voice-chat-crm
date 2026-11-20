import {
  HomeIcon,
  ContactsIcon,
  ChatIcon,
  BotIcon,
  ChartIcon,
  GridIcon,
  GearIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  ZapIcon,
  ClockIcon,
  SlidersIcon,
  LotusLogo,
  AvatarIcon,
  DoubleCheckIcon,
  PackageIcon,
  ShirtIcon,
} from '../icons.jsx'

const railItems = [
  { id: 'home', Icon: HomeIcon, label: 'Home' },
  { id: 'orders', Icon: PackageIcon, label: 'Orders' },
  { id: 'products', Icon: ShirtIcon, label: 'Products' },
  { id: 'chat', Icon: ChatIcon, label: 'Chats' },
  { id: 'customers', Icon: ContactsIcon, label: 'Customers' },
  { id: 'ai', Icon: BotIcon, label: 'AI' },
  { id: 'reports', Icon: ChartIcon, label: 'Reports' },
  { id: 'apps', Icon: GridIcon, label: 'Apps' },
]

// "Orders are coming soon", "Home is coming soon"
const soon = (label) => `${label} ${label.endsWith('s') ? 'are' : 'is'} coming soon`

export function IconRail({ activeRail, onRail, onToast }) {
  return (
    <aside className="rail">
      <div className="rail__logo" title="Nara Wear">
        <LotusLogo />
      </div>
      <nav className="rail__nav" aria-label="Main navigation">
        {railItems.map(({ id, Icon, label }) => (
          <button
            key={id}
            className={`rail__btn ${activeRail === id ? 'is-active' : ''}`}
            aria-label={label}
            title={label}
            onClick={() => (id === 'ai' ? onRail(id) : onToast(soon(label)))}
          >
            <Icon size={19} />
          </button>
        ))}
      </nav>
      <div className="rail__bottom">
        <button
          className="rail__btn"
          aria-label="Settings"
          title="Settings"
          onClick={() => onToast('Settings are coming soon')}
        >
          <GearIcon size={19} />
        </button>
        <button
          className="rail__btn rail__avatar"
          aria-label="Profile"
          title="Profile"
          onClick={() => onToast('Your profile is coming soon')}
        >
          <AvatarIcon size={18} />
        </button>
      </div>
    </aside>
  )
}

/** Menu utama di drawer (layar kecil): isi rail dengan label. Hanya AI yang punya halaman. */
export function MainMenu({ activeRail, onOpen, onToast }) {
  return (
    <div className="navpanel">
      <h2 className="navpanel__title" tabIndex={-1} data-autofocus>
        Nara Wear
      </h2>
      <nav className="navlist" aria-label="Main navigation">
        {railItems.map(({ id, Icon, label }) => (
          <button
            key={id}
            className={`navlist__item ${activeRail === id ? 'is-active' : ''}`}
            aria-current={activeRail === id ? 'page' : undefined}
            onClick={() => (id === 'ai' ? onOpen(id) : onToast(soon(label)))}
          >
            <Icon size={16} />
            <span>{label}</span>
            {id === 'ai' && (
              <span className="navlist__go">
                <ChevronRightIcon size={15} />
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

const navItems = [
  { id: 'assistant', label: 'Assistant', Icon: BotIcon },
  { id: 'suggestions', label: 'Suggestions', Icon: InfoIcon },
  { id: 'automations', label: 'Automations', Icon: ZapIcon },
  { id: 'approvals', label: 'Approvals', Icon: DoubleCheckIcon },
  { id: 'activity', label: 'Activity', Icon: ClockIcon },
]

const prefItems = ['Permissions', 'Voice & style', 'integrations', 'Notifications']

export function NavPanel({
  audience,
  setAudience,
  query,
  setQuery,
  activeNav,
  setActiveNav,
  prefsOpen,
  setPrefsOpen,
  onToast,
  onBack,
}) {
  const q = query.trim().toLowerCase()
  const visibleItems = navItems.filter((i) => i.label.toLowerCase().includes(q))
  const visiblePrefs = prefItems.filter((i) => i.toLowerCase().includes(q))
  const showPrefs = q === '' || 'preferences'.includes(q) || visiblePrefs.length > 0

  return (
    <div className="navpanel">
      {onBack ? (
        <h2 className="navpanel__title">
          <button className="navpanel__back" onClick={onBack} aria-label="Back to main menu" data-autofocus>
            <ChevronLeftIcon size={17} />
            <span>AI</span>
          </button>
        </h2>
      ) : (
        <h2 className="navpanel__title">AI</h2>
      )}

      <label className="navpanel__search">
        <SearchIcon size={15} />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search AI menu"
        />
      </label>

      <div className="seg" role="tablist" aria-label="Scope">
        {['Personal', 'Team'].map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={audience === s}
            className={`seg__btn ${audience === s ? 'is-active' : ''}`}
            onClick={() => setAudience(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <nav className="navlist" aria-label="AI sections">
        {visibleItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`navlist__item ${activeNav === id ? 'is-active' : ''}`}
            onClick={() => (id === 'assistant' ? setActiveNav(id) : onToast(`${label} is coming soon`))}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
        {visibleItems.length === 0 && !showPrefs && (
          <p className="navlist__empty">No menu found</p>
        )}

        {showPrefs && (
          <>
            <button
              className="navlist__item navlist__item--prefs"
              aria-expanded={prefsOpen}
              onClick={() => setPrefsOpen(!prefsOpen)}
            >
              <SlidersIcon size={16} />
              <span>Preferences</span>
              <span className={`navlist__chev ${prefsOpen ? 'is-open' : ''}`}>
                <ChevronDownIcon size={15} />
              </span>
            </button>
            {(prefsOpen || q !== '') && (
              <div className="navlist__sub">
                {(q === '' ? prefItems : visiblePrefs).map((label) => (
                  <button
                    key={label}
                    className="navlist__subitem"
                    onClick={() => onToast(`${label} settings are coming soon`)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </nav>
    </div>
  )
}
