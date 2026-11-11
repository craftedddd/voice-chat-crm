// Kumpulan ikon SVG kecil (gaya outline, mirip Lucide) dipakai di seluruh UI.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ size = 18, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} {...rest}>
      {children}
    </svg>
  )
}

export const HomeIcon = (p) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.7V21h14V9.7" />
  </Svg>
)

export const ContactsIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <circle cx="9" cy="10" r="1.9" />
    <path d="M5.8 16.5c.6-1.7 2-2.5 3.2-2.5s2.6.8 3.2 2.5" />
    <path d="M15 9.5h3.2M15 13h3.2" />
  </Svg>
)

export const TasksIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="m8.2 12.2 2.6 2.6 5-5.6" />
  </Svg>
)

export const ChatIcon = (p) => (
  <Svg {...p}>
    <path d="M12 20.5a8.5 8.5 0 1 0-8.5-8.5c0 1.5.4 2.9 1.1 4.1L3.5 20.5l4.5-1.1a8.4 8.4 0 0 0 4 1.1Z" />
  </Svg>
)

export const CalendarIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17M8.3 3v4M15.7 3v4" />
  </Svg>
)

export const BotIcon = (p) => (
  <Svg {...p}>
    <path d="M12 4.2v2.6" />
    <circle cx="12" cy="3.6" r="0.9" />
    <rect x="4.6" y="6.8" width="14.8" height="11.4" rx="3.4" />
    <path d="M2.4 11.5v2.6M21.6 11.5v2.6" />
    <circle cx="9.2" cy="12.3" r="1" fill="currentColor" stroke="none" />
    <circle cx="14.8" cy="12.3" r="1" fill="currentColor" stroke="none" />
  </Svg>
)

export const ChartIcon = (p) => (
  <Svg {...p}>
    <path d="M4 4v16h16" />
    <path d="m7.5 14.5 3.2-3.4 2.6 2.6 4.6-5.2" />
  </Svg>
)

export const GridIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.8" />
    <rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.8" />
    <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.8" />
    <rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.8" />
  </Svg>
)

export const GearIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
  </Svg>
)

export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.2-3.2" />
  </Svg>
)

export const ChevronDownIcon = (p) => (
  <Svg {...p}>
    <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
  </Svg>
)

export const PlusIcon = (p) => (
  <Svg {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Svg>
)

export const ExternalIcon = (p) => (
  <Svg {...p}>
    <path d="M13.5 5H19v5.5" />
    <path d="M19 5l-7.5 7.5" />
    <path d="M19 13.5V19H5V5h5.5" />
  </Svg>
)

export const DoubleCheckIcon = (p) => (
  <Svg {...p}>
    <path d="m2 12.8 4.3 4.3L14.6 8" />
    <path d="m9.6 15.4 1.7 1.7L22 6.5" />
  </Svg>
)

export const MicIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
    <path d="M12 18v3" />
  </Svg>
)

export const MicOffIcon = (p) => (
  <Svg {...p}>
    <path d="M9 6a3 3 0 0 1 6 0v6c0 .4-.1.9-.2 1.3" />
    <path d="M9 9.5V12a3 3 0 0 0 4.9 2.3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 10.6 5" />
    <path d="M18.5 11.5c0 .7-.1 1.3-.3 1.9" />
    <path d="M12 18v3" />
    <path d="m4.5 4.5 15 15" />
  </Svg>
)

export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)

export const UserPlusIcon = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="8.2" r="3.4" />
    <path d="M4 20c.7-3.4 3.2-5 6-5 1.4 0 2.7.4 3.8 1.2" />
    <path d="M18.5 13.5v6M15.5 16.5h6" />
  </Svg>
)

export const WaveIcon = (p) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M4.5 10.5v3M8.25 7.5v9M12 5v14M15.75 8.5v7M19.5 10.5v3" />
  </Svg>
)

export const MenuIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
)

export const InfoIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11.2V16" />
    <circle cx="12" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
)

export const ZapIcon = (p) => (
  <Svg {...p}>
    <path d="M13 2.5 4.8 13.3h5.7L11 21.5l8.2-10.8h-5.7L13 2.5Z" />
  </Svg>
)

export const ClockIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)

export const SlidersIcon = (p) => (
  <Svg {...p}>
    <path d="M4 8h8.5M18.8 8H20" />
    <circle cx="15.8" cy="8" r="2.1" />
    <path d="M4 16h1.2M11.5 16H20" />
    <circle cx="8.2" cy="16" r="2.1" />
  </Svg>
)

export const LotusLogo = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
    <defs>
      <linearGradient id="lotus-g" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#8B7CF6" />
        <stop offset="1" stopColor="#5F4FE0" />
      </linearGradient>
    </defs>
    <g fill="url(#lotus-g)">
      <path d="M14 4.5c2.1 2.5 3.1 5.1 3.1 7.5 0 3.1-1.3 5.2-3.1 6.3-1.8-1.1-3.1-3.2-3.1-6.3 0-2.4 1-5 3.1-7.5Z" />
      <path
        opacity="0.82"
        d="M4.6 10.2c3-.2 5.6.7 7.4 2.3 2.2 2 2.9 4.5 2.4 6.6-2.1.5-4.7-.3-6.7-2.1-1.9-1.8-3-4.2-3.1-6.8Z"
      />
      <path
        opacity="0.82"
        d="M23.4 10.2c-3-.2-5.6.7-7.4 2.3-2.2 2-2.9 4.5-2.4 6.6 2.1.5 4.7-.3 6.7-2.1 1.9-1.8 3-4.2 3.1-6.8Z"
      />
      <path
        opacity="0.6"
        d="M2.8 16.9c2.5 1.3 5.6 1.8 8.1 1.1-.9 1.9-2.9 3.3-5.1 3.3-1.4 0-2.5-1.9-3-4.4ZM25.2 16.9c-2.5 1.3-5.6 1.8-8.1 1.1.9 1.9 2.9 3.3 5.1 3.3 1.4 0 2.5-1.9 3-4.4Z"
      />
    </g>
  </svg>
)

export const AvatarIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="9" r="3.4" />
    <path d="M5 20c1-3.6 4-5.2 7-5.2s6 1.6 7 5.2" />
  </Svg>
)
