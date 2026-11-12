import {
  HomeIcon,
  ContactsIcon,
  TasksIcon,
  ChatIcon,
  CalendarIcon,
  BotIcon,
  ChartIcon,
  GridIcon,
  GearIcon,
  SearchIcon,
  ChevronDownIcon,
  InfoIcon,
  ZapIcon,
  ClockIcon,
  SlidersIcon,
  LotusLogo,
  AvatarIcon,
  DoubleCheckIcon,
} from '../icons.jsx'

const railItems = [
  { id: 'home', Icon: HomeIcon, label: 'Home' },
  { id: 'contacts', Icon: ContactsIcon, label: 'Contacts' },
  { id: 'tasks', Icon: TasksIcon, label: 'Tasks' },
  { id: 'chat', Icon: ChatIcon, label: 'Messages' },
  { id: 'calendar', Icon: CalendarIcon, label: 'Calendar' },
  { id: 'ai', Icon: BotIcon, label: 'AI' },
  { id: 'reports', Icon: ChartIcon, label: 'Reports' },
  { id: 'apps', Icon: GridIcon, label: 'Apps' },
]

export function IconRail({ activeRail, onRail, onToast }) {
  return (
    <aside className="rail">
      <div className="rail__logo" title="Compro CRM">
        <LotusLogo />
      </div>
      <nav className="rail__nav" aria-label="Main navigation">
        {railItems.map(({ id, Icon, label }) => (
          <button
            key={id}
            className={`rail__btn ${activeRail === id ? 'is-active' : ''}`}
            aria-label={label}
            title={label}
            onClick={() => (id === 'ai' ? onRail(id) : onToast(`${label} is coming soon`))}
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
}) {
  const q = query.trim().toLowerCase()
  const visibleItems = navItems.filter((i) => i.label.toLowerCase().includes(q))
  const visiblePrefs = prefItems.filter((i) => i.toLowerCase().includes(q))
  const showPrefs = q === '' || 'preferences'.includes(q) || visiblePrefs.length > 0

  return (
    <div className="navpanel">
      <h2 className="navpanel__title">AI</h2>

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
            onClick={() => setActiveNav(id)}
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
