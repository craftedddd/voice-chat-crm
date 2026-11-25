import { CheckIcon } from '../icons.jsx'

/** Label tombol "ya": jumlahnya mengikuti pesanan yang masih dicentang. */
export const labelsFor = (n) => (n ? `Create ${n} label${n === 1 ? '' : 's'}` : 'Select an order')

/** Jumlah pesanan yang masih dicentang di kartu persetujuan (null kalau kartunya tanpa daftar). */
export const pickedOf = (card) => (card?.orders ? card.orders.length - (card.skip?.length || 0) : null)

function Row({ o, on, children }) {
  return (
    <>
      {children}
      <span className="opick__mark" aria-hidden="true">
        {on && <CheckIcon size={11} strokeWidth={2.4} />}
      </span>
      <span className="opick__main">
        <span className="opick__item">{o.item}</span>
        <span className="opick__meta">
          {o.shop} · #{o.id}
        </span>
      </span>
      <span className="opick__due">
        <span className="sr-only">due </span>
        {o.due}
      </span>
    </>
  )
}

/**
 * Daftar pesanan bercentang sebelum label pengiriman dibuat (label memesan kurir,
 * jadi user melihat dulu pesanan mana saja). Ketuk satu baris untuk melewatinya.
 * Dipakai di percakapan Chat dan di kartu "Needs your OK" pada feed Actions.
 *
 * frozen: sudah dijawab, daftarnya tetap tampil sebagai catatan dan tidak bisa diubah.
 * declined: tidak ada label yang dibuat (dijawab "Not now", ditinggal, atau di-undo), semua baris memudar.
 */
export default function OrderPick({ orders, skip = [], onToggle, compact = false, frozen = false, declined = false }) {
  const cls = `opick ${compact ? 'opick--compact' : ''} ${frozen ? 'is-frozen' : ''} ${declined ? 'is-declined' : ''}`
  if (frozen) {
    return (
      <ul className={cls} aria-label={declined ? 'Orders, no labels created' : 'Orders and their labels'}>
        {orders.map((o) => {
          const on = !declined && !skip.includes(o.id)
          return (
            <li key={o.id} className={`opick__row ${on || declined ? '' : 'is-off'}`}>
              <Row o={o} on={on}>
                {!declined && <span className="sr-only">{on ? 'Label created: ' : 'Skipped: '}</span>}
              </Row>
            </li>
          )
        })}
      </ul>
    )
  }
  return (
    <ul className={cls} aria-label="Orders to create labels for">
      {orders.map((o) => {
        const on = !skip.includes(o.id)
        return (
          <li key={o.id}>
            <label className={`opick__row ${on ? '' : 'is-off'}`}>
              <Row o={o} on={on}>
                <input type="checkbox" className="opick__input" checked={on} onChange={() => onToggle(o.id)} />
              </Row>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
