import { useEffect, useRef, useState } from 'react'
import { CheckIcon } from '../icons.jsx'
import { FOCUS_OPTIONS, SHOP_OPTIONS, PRODUCT_OPTIONS, briefingFor } from '../voice/brain.js'

export const NAME_MAX = 20
const ALL_FOCUS = ['orders', 'chats', 'stock', 'complaints']

// Template: mengisi form sekaligus, user masih bisa mengubahnya sebelum menyimpan
const TEMPLATES = [
  { name: 'Complaints & returns', focus: ['complaints'], shop: 'both', products: [] },
  { name: 'TikTok only', focus: ALL_FOCUS, shop: 'tiktok', products: [] },
  { name: 'Hijabs', focus: ALL_FOCUS, shop: 'both', products: ['hijabs'] },
]

const labelOf = (list, id) => list.find((x) => x.id === id)?.label || ''

/** Nama otomatis dari pilihan, misalnya "TikTok hoodies", "Orders and chats", atau "Shopee view". */
function autoName({ focus, shop, products }) {
  const shopWord = shop === 'both' ? '' : labelOf(SHOP_OPTIONS, shop)
  const focusWords = focus.length <= 2 ? focus.map((f, i) => (i ? labelOf(FOCUS_OPTIONS, f).toLowerCase() : labelOf(FOCUS_OPTIONS, f))).join(' and ') : ''
  const what = products.length === 1 ? labelOf(PRODUCT_OPTIONS, products[0]) : focusWords
  const lower = (w) => w.toLowerCase()
  const options = [
    [shopWord, shopWord ? lower(what) : what].filter(Boolean).join(' '),
    shopWord ? `${shopWord} view` : '',
    'My view',
  ]
  return options.find((n) => n && n.length <= NAME_MAX)
}

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

function Chip({ on, onClick, children }) {
  return (
    <button type="button" className={`chip chip--toggle ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onClick}>
      {on && <CheckIcon size={12} strokeWidth={2.2} />}
      {children}
    </button>
  )
}

/**
 * Form custom context (dipakai di popover desktop dan bottom sheet mobile).
 * initial = context yang diedit, atau null untuk context baru.
 */
export default function ContextEditor({ initial, lang, takenNames = [], onSave, onDelete, onCancel }) {
  const editing = !!initial
  const [focus, setFocus] = useState(initial?.focus || ['orders', 'chats'])
  const [shop, setShop] = useState(initial?.shop || 'both')
  const [products, setProducts] = useState(initial?.products || [])
  const [name, setName] = useState(initial?.name || '')
  const [named, setNamed] = useState(editing) // user sudah mengetik nama sendiri
  const [error, setError] = useState('')
  const nameRef = useRef(null)

  // Fokus ke nama hanya di perangkat dengan mouse; di HP keyboard tidak langsung muncul
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) nameRef.current?.focus({ preventScroll: true })
  }, [])

  const suggested = autoName({ focus, shop, products })
  const shownName = named ? name : suggested
  const draft = { name: shownName, focus, shop, products }
  const preview = briefingFor(lang, draft)

  const applyTemplate = (t) => {
    setFocus(t.focus)
    setShop(t.shop)
    setProducts(t.products)
    setName(t.name)
    setNamed(true)
    setError('')
  }

  const save = (e) => {
    e.preventDefault()
    if (focus.length === 0) {
      setError('Pick at least one thing to focus on')
      return
    }
    let finalName = shownName.trim() || suggested
    // Nama kembar diberi nomor supaya tab tetap bisa dibedakan
    if (takenNames.includes(finalName)) {
      let n = 2
      while (takenNames.includes(`${finalName} ${n}`)) n++
      finalName = `${finalName.slice(0, NAME_MAX - 2)} ${n}`
    }
    onSave({ ...(initial || {}), name: finalName, focus, shop, products })
  }

  return (
    <form className="ctxform" onSubmit={save} aria-label={editing ? 'Edit context' : 'New context'}>
      <div className="ctxform__head">
        <h3 className="ctxform__title">{editing ? 'Edit context' : 'New context'}</h3>
        <p className="ctxform__sub">Pick what the assistant should brief you on first.</p>
      </div>

      {!editing && (
        <div className="ctxform__group">
          <span className="ctxform__label">Start from</span>
          <div className="chips">
            {TEMPLATES.map((t) => (
              <button type="button" key={t.name} className="chip chip--toggle" onClick={() => applyTemplate(t)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="ctxform__group">
        <span className="ctxform__label">Name</span>
        <input
          ref={nameRef}
          className="ctxform__input"
          type="text"
          value={shownName}
          maxLength={NAME_MAX}
          placeholder={suggested}
          onChange={(e) => {
            setName(e.target.value)
            setNamed(true)
          }}
        />
      </label>

      <div className="ctxform__group" role="group" aria-label="Focus on">
        <span className="ctxform__label">Focus on</span>
        <div className="chips">
          {FOCUS_OPTIONS.map((o) => (
            <Chip
              key={o.id}
              on={focus.includes(o.id)}
              onClick={() => {
                setFocus(toggle(focus, o.id))
                setError('')
              }}
            >
              {o.label}
            </Chip>
          ))}
        </div>
        {error && <p className="ctxform__error">{error}</p>}
      </div>

      <div className="ctxform__group">
        <span className="ctxform__label">Shop</span>
        <div className="seg ctxform__seg" role="radiogroup" aria-label="Shop">
          {SHOP_OPTIONS.map((o) => (
            <button
              type="button"
              key={o.id}
              role="radio"
              aria-checked={shop === o.id}
              className={`seg__btn ${shop === o.id ? 'is-active' : ''}`}
              onClick={() => setShop(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ctxform__group" role="group" aria-label="Products">
        <span className="ctxform__label">Products</span>
        <div className="chips">
          <Chip on={products.length === 0} onClick={() => setProducts([])}>
            All
          </Chip>
          {PRODUCT_OPTIONS.map((o) => (
            <Chip key={o.id} on={products.includes(o.id)} onClick={() => setProducts(toggle(products, o.id))}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="ctxform__preview" aria-live="polite">
        <span className="ctxform__label">Assistant opens with</span>
        <p>
          {preview.lead}
          {preview.tail}
        </p>
      </div>

      <div className="ctxform__actions">
        {editing && (
          <button type="button" className="tlink tlink--danger" onClick={onDelete}>
            Delete
          </button>
        )}
        <button type="button" className="tlink ctxform__cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="tbtn">
          {editing ? 'Save' : 'Add context'}
        </button>
      </div>
    </form>
  )
}
