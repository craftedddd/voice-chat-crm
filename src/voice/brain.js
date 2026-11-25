// "Otak" demo: asisten suara untuk seller online "Nara Wear" (Shopee + TikTok Shop).
// Percakapan proaktif berbasis aturan: memberi rekomendasi, menawarkan bantuan,
// menunggu izin user, lalu menindaklanjuti. Tidak memanggil AI eksternal.
//
// Bahasa percakapan: 'en' atau 'id'. Ucapan assistant, briefing, dan caption
// mengikuti bahasa itu. WORK (feed) dan CARDS (toast persetujuan) tetap bahasa
// Inggris karena bagian dari UI.

const L = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? v.en : v)
const rnd = (list) => list[Math.floor(Math.random() * list.length)]

// ---------------------------------------------------------------------------
// Briefing pembuka per tab. lead = bagian gelap, tail = bagian abu (gaya desain).
// ---------------------------------------------------------------------------
const BRIEFINGS = {
  en: {
    Everything: {
      lead: 'Morning! 18 orders ship today, 4 of them by 2 PM.',
      tail: ' 6 chats are unanswered, and the black hoodie in M is down to 3....',
    },
    Orders: {
      lead: '18 orders need to ship today. 4 are due by 2 PM, 3 on Shopee and 1 on TikTok',
      tail: ", so I'd start with those....",
    },
    Chats: {
      lead: 'You have 6 unanswered chats. 4 of them are asking about sizes',
      tail: ', and one buyer has a complaint about color....',
    },
    Stock: {
      lead: 'The black hoodie in size M is down to 3, and it sold 9 yesterday',
      tail: '. The rest of your stock looks fine for now....',
    },
  },
  id: {
    Everything: {
      lead: 'Pagi! Hari ini 18 pesanan dikirim, 4 harus sebelum jam 2.',
      tail: ' 6 chat belum dibalas, dan hoodie hitam M tinggal 3....',
    },
    Orders: {
      lead: '18 pesanan harus dikirim hari ini. 4 batasnya jam 2 siang, 3 Shopee dan 1 TikTok',
      tail: ', itu yang aku duluin....',
    },
    Chats: {
      lead: 'Ada 6 chat yang belum dibalas. 4 di antaranya nanya soal ukuran',
      tail: ', dan ada satu pembeli yang komplain soal warna....',
    },
    Stock: {
      lead: 'Stok hoodie hitam size M tinggal 3, padahal kemarin laku 9',
      tail: '. Stok lainnya masih aman....',
    },
  },
}

export function briefingFor(lang, tab) {
  if (tab && typeof tab === 'object') return factBriefing(scopeOf(tab), [], lang, tab.shop)
  const set = BRIEFINGS[lang] || BRIEFINGS.en
  return set[tab] || set.Everything
}

export function briefingText(tab, lang = 'en') {
  const b = briefingFor(lang, tab)
  return (b.lead + b.tail).replace(/\.{2,}$/, '.')
}

// ---------------------------------------------------------------------------
// Custom context: fakta toko dengan atribut fokus, toko, dan produk.
// Context buatan user = { id, name, focus: [...], shop: 'both'|'shopee'|'tiktok', products: [] (kosong = semua) }.
// Fakta yang cocok menyusun briefing pembuka dan urutan tawaran.
// ---------------------------------------------------------------------------
export const FOCUS_OPTIONS = [
  { id: 'orders', label: 'Orders' },
  { id: 'chats', label: 'Chats' },
  { id: 'stock', label: 'Stock' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'sales', label: 'Sales' },
]
export const SHOP_OPTIONS = [
  { id: 'both', label: 'Both' },
  { id: 'shopee', label: 'Shopee' },
  { id: 'tiktok', label: 'TikTok' },
]
export const PRODUCT_OPTIONS = [
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'tees', label: 'Tees' },
  { id: 'hijabs', label: 'Hijabs' },
]

const FACTS = [
  {
    key: 'ship',
    focus: 'orders',
    shops: ['shopee', 'tiktok'],
    products: ['hoodies', 'tees', 'hijabs'],
    line: () => ({
      en: '4 orders are due by 2 PM, 3 on Shopee and 1 on TikTok.',
      id: '4 pesanan harus dikirim sebelum jam 2, 3 Shopee dan 1 TikTok.',
    }),
  },
  {
    key: 'chats',
    focus: 'chats',
    shops: ['shopee', 'tiktok'],
    products: ['hoodies', 'tees'],
    line: () => ({
      en: '4 buyers are asking about hoodie and tee sizes.',
      id: '4 pembeli nanya soal ukuran hoodie dan kaos.',
    }),
  },
  {
    key: 'stock',
    focus: 'stock',
    shops: ['shopee', 'tiktok'],
    products: ['hoodies'],
    line: () => ({ en: 'The black hoodie in M is down to 3.', id: 'Hoodie hitam size M tinggal 3.' }),
  },
  {
    key: 'complaint',
    focus: 'complaints',
    shops: ['tiktok'],
    products: ['hijabs'],
    line: () => ({
      en: 'One TikTok buyer says their hijab color looks different from the photo.',
      id: 'Ada pembeli TikTok yang bilang warna hijabnya beda dari foto.',
    }),
  },
  {
    key: 'sales',
    focus: 'sales',
    shops: ['shopee', 'tiktok'],
    products: ['hoodies', 'tees', 'hijabs'],
    line: (shop) =>
      shop === 'tiktok'
        ? { en: 'Yesterday TikTok brought in 2.5 million rupiah, 60 percent of your sales.', id: 'Kemarin TikTok menghasilkan 2,5 juta, 60 persen dari penjualanmu.' }
        : shop === 'shopee'
          ? { en: 'Yesterday Shopee brought in 1.7 million rupiah, 40 percent of your sales.', id: 'Kemarin Shopee menghasilkan 1,7 juta, 40 persen dari penjualanmu.' }
          : { en: 'Yesterday you had 31 orders worth 4.2 million rupiah, 60 percent from TikTok.', id: 'Kemarin ada 31 pesanan senilai 4,2 juta, 60 persennya dari TikTok.' },
  },
]

// Cakupan tab bawaan (kunci antrean)
const BUILTIN_SCOPE = {
  Everything: ['ship', 'chats', 'stock', 'complaint'],
  Orders: ['ship'],
  Chats: ['chats', 'complaint'],
  Stock: ['stock'],
}

/** Kunci fakta yang masuk cakupan sebuah tab (bawaan atau custom). */
export function scopeOf(tab) {
  if (!tab || typeof tab !== 'object') return BUILTIN_SCOPE[tab] || BUILTIN_SCOPE.Everything
  const products = tab.products || []
  return FACTS.filter(
    (f) =>
      (tab.focus || []).includes(f.focus) &&
      (tab.shop === 'both' || !tab.shop || f.shops.includes(tab.shop)) &&
      (products.length === 0 || f.products.some((p) => products.includes(p)))
  ).map((f) => f.key)
}

/** Nama tab untuk ucapan dan ringkasan. */
export const tabName = (tab) => (tab && typeof tab === 'object' ? tab.name : tab)

const NOTHING_HERE = {
  en: 'Nothing needs you in this view right now.',
  id: 'Di tampilan ini lagi nggak ada yang perlu kamu urus.',
}
const ALL_HANDLED = { en: 'Everything in this view is handled.', id: 'Semua yang ada di sini udah beres.' }
// Versi chat menyebut nama tab, karena pemisah tab sudah menandai perpindahannya
const NOTHING_IN = { en: (n) => `Nothing needs you in ${n} right now.`, id: (n) => `Di ${n} lagi nggak ada yang perlu kamu urus.` }
const ALL_HANDLED_IN = { en: (n) => `Nothing urgent left in ${n}.`, id: (n) => `Di ${n} udah nggak ada yang mendesak.` }

/** Briefing dari fakta yang cocok; yang sudah ditangani di sesi ini dilewati. */
function factBriefing(scope, done, lang, shop) {
  const lines = FACTS.filter((f) => scope.includes(f.key) && !done.includes(f.key)).map((f) => L(f.line(shop), lang))
  if (!lines.length) return { lead: L(done.length ? ALL_HANDLED : NOTHING_HERE, lang), tail: '' }
  return { lead: lines[0], tail: lines.length > 1 ? ` ${lines.slice(1).join(' ')}` : '' }
}

// ---------------------------------------------------------------------------
// Langkah percakapan. Tiap langkah punya pertanyaan (ask) dan hasil jika user
// menjawab ya/tidak. Hasil: { reply, toast?, next?: idLangkah, mark?: kunciSelesai }
// buyer: true = aksi terlihat pembeli, SELALU minta persetujuan (abaikan Ask Me First).
// review: true = user harus melihat daftarnya dulu (label memesan kurir), juga SELALU minta persetujuan.
// ---------------------------------------------------------------------------
const STEPS = {
  offer_ship: {
    review: true,
    ask: {
      en: ['Want me to get shipping labels ready for the 4 orders due by 2 PM? The earliest is due at 11 AM.'],
      id: ['Mau aku siapin label pengiriman buat 4 pesanan yang batasnya jam 2 siang? Yang paling awal jam 11.'],
    },
    short: { en: 'Want me to get those 4 shipping labels ready?', id: 'Mau aku siapin 4 label pengirimannya?' },
    yes: {
      reply: {
        en: 'Done. 4 shipping labels are ready, 3 for Shopee and 1 for TikTok. Just pack them and hand them to the courier.',
        id: 'Beres. 4 label pengiriman udah siap, 3 Shopee dan 1 TikTok. Tinggal dikemas dan diserahkan ke kurir.',
      },
      toast: '4 shipping labels ready',
      mark: 'ship',
    },
    no: { reply: { en: "Okay, I'll leave those for you.", id: 'Oke, aku biarin dulu ya.' }, mark: 'ship' },
  },
  offer_chats: {
    buyer: true,
    ask: {
      en: ['4 people are asking about sizes. Want me to reply with the size chart?'],
      id: ['Ada 4 orang yang nanya soal ukuran. Mau aku balas pakai size chart?'],
    },
    short: { en: 'Want me to reply to the size questions with your size chart?', id: 'Mau aku balas pertanyaan ukurannya pakai size chart?' },
    yes: {
      reply: {
        en: 'Sent. Each buyer got the size chart with the size they asked about highlighted.',
        id: 'Udah terkirim. Tiap pembeli dapat size chart, dengan ukuran yang mereka tanyakan ditandai.',
      },
      toast: 'Replied to 4 size questions',
      mark: 'chats',
    },
    no: { reply: { en: "Okay, I won't reply for now.", id: 'Oke, belum aku balas dulu.' }, mark: 'chats' },
  },
  offer_stock: {
    ask: {
      en: ["The black hoodie in M is down to 3. Want me to sync that stock across Shopee and TikTok so you don't oversell?"],
      id: ['Stok hoodie hitam size M tinggal 3. Mau aku samain stoknya di Shopee dan TikTok biar nggak oversell?'],
    },
    short: { en: 'Want me to sync the stock on both shops?', id: 'Mau aku samain stoknya di kedua toko?' },
    yes: {
      reply: {
        en: "Done. Both shops now show 3 left, so you won't sell more than you have.",
        id: 'Beres. Stok di kedua toko sekarang sama-sama 3, jadi nggak akan kejual lebih dari yang ada.',
      },
      toast: 'Stock synced on 2 shops',
      mark: 'stock',
    },
    no: { reply: { en: 'Okay, I left the stock as it is.', id: 'Oke, stoknya aku biarin dulu.' }, mark: 'stock' },
  },
  offer_exchange: {
    buyer: true,
    ask: {
      en: ['One buyer says the color looks different from the photo. Want me to offer an exchange?'],
      id: ['Ada pembeli yang bilang warnanya beda dari foto. Mau aku tawarin tukar barang?'],
    },
    short: { en: 'Want me to offer an exchange?', id: 'Mau aku tawarin tukar barang?' },
    yes: {
      reply: {
        en: "Sent. I apologized, offered an exchange for another color, and asked which one they'd like.",
        id: 'Udah terkirim. Aku minta maaf, tawarin tukar ke warna lain, dan tanya warna mana yang dia mau.',
      },
      toast: 'Exchange offered to the buyer',
      next: 'offer_return_label',
    },
    no: { reply: { en: "Okay, I'll leave that chat for you.", id: 'Oke, chat itu aku biarin dulu.' }, mark: 'complaint' },
  },
  offer_return_label: {
    ask: {
      en: ['Want me to create a return label so they can send it back?'],
      id: ['Mau aku buatin label retur biar dia bisa kirim balik barangnya?'],
    },
    yes: {
      reply: {
        en: "Done. The return label is ready, and I'll send it once they pick a color.",
        id: 'Beres. Label returnya udah siap, nanti aku kirim begitu dia pilih warnanya.',
      },
      toast: 'Return label created',
      mark: 'complaint',
    },
    no: { reply: { en: "Okay, we'll wait for their reply first.", id: 'Oke, kita tunggu balasan dia dulu.' }, mark: 'complaint' },
  },
  offer_suggest: {
    ask: { en: ['Want me to suggest where to start?'], id: ['Mau aku kasih saran mulai dari mana?'] },
    yes: { reply: { en: 'Sure.', id: 'Oke.' }, next: 'SUGGEST' },
    no: { reply: { en: "No problem. I'm here whenever you need me.", id: 'Oke, aku standby kalau butuh apa-apa.' } },
  },
}

// ---------------------------------------------------------------------------
// Live actions: langkah kerja yang ditampilkan saat aksi berjalan (UI, bahasa Inggris).
// Kunci = teks toast hasil aksi. key = item antrean yang ditangani (untuk Still waiting),
// kind menentukan link Open, teks undo, dan ikon ringkasan.
// ---------------------------------------------------------------------------
const WORK = {
  '4 shipping labels ready': {
    key: 'ship',
    kind: 'label',
    title: 'Creating shipping labels',
    steps: ['Checked ship-by times', 'Grouped 4 urgent orders', 'Created 4 shipping labels'],
    detail: '3 Shopee, 1 TikTok · due 2:00 PM',
    undone: 'Labels canceled',
  },
  'Replied to 4 size questions': {
    key: 'chats',
    kind: 'reply',
    title: 'Replying to size questions',
    steps: ['Read 4 chats', 'Matched each to the size they asked', 'Sent replies'],
    detail: 'Size chart sent to 4 buyers',
    undone: 'Replies unsent',
  },
  'Stock synced on 2 shops': {
    key: 'stock',
    kind: 'stock',
    title: 'Syncing stock',
    steps: ['Checked stock on both shops', 'Updated both to 3'],
    detail: 'Black hoodie M · 3 left on Shopee and TikTok',
    undone: 'Stock change reverted',
  },
  'Exchange offered to the buyer': {
    key: 'complaint',
    kind: 'reply',
    title: 'Replying to the complaint',
    steps: ['Read the complaint and photos', 'Drafted a reply with exchange options', 'Sent the reply'],
    detail: 'TikTok · asked which color they want',
    undone: 'Reply unsent',
  },
  'Return label created': {
    key: 'complaint',
    kind: 'label',
    title: 'Creating a return label',
    steps: ['Opened the order', 'Created a return label'],
    detail: 'Ready to send once they pick a color',
    undone: 'Return label canceled',
  },
}

// 4 pesanan yang harus dikirim sebelum jam 2 siang (data demo, label UI bahasa Inggris).
// Ditampilkan sebagai daftar bercentang sebelum label dibuat.
export const DUE_ORDERS = [
  { id: '2411-0832', shop: 'Shopee', item: 'Black hoodie M ×1', due: '11:00 AM' },
  { id: '2411-0847', shop: 'Shopee', item: 'White tee L ×2', due: '12:00 PM' },
  { id: '2411-0851', shop: 'Shopee', item: 'Sage hijab ×3', due: '1:30 PM' },
  { id: '5521-1094', shop: 'TikTok', item: 'Grey hoodie XL ×1', due: '2:00 PM' },
]

// Kartu "Needs your OK" (toast persetujuan dan feed). Label UI bahasa Inggris,
// say = kalimat yang dikirim seolah diucapkan user, dalam bahasa percakapan.
const NOT_NOW = { label: 'Not now', say: { en: 'Not now', id: 'Nanti aja' } }
const CARDS = {
  offer_ship: {
    title: 'Create shipping labels?',
    detail: 'Due by 2:00 PM · books a courier pickup',
    orders: DUE_ORDERS,
    yes: { label: 'Create labels', say: { en: 'Yes, do it', id: 'Iya, gas' } },
    no: NOT_NOW,
  },
  offer_chats: {
    title: 'Reply to 4 size questions?',
    detail: 'Buyers will see this · Shopee and TikTok',
    yes: { label: 'Send replies', say: { en: 'Yes, send them', id: 'Iya, kirim aja' } },
    no: NOT_NOW,
  },
  offer_stock: {
    title: 'Sync black hoodie M stock?',
    detail: 'Set to 3 on Shopee and TikTok',
    yes: { label: 'Sync stock', say: { en: 'Yes, sync it', id: 'Iya, samain' } },
    no: NOT_NOW,
  },
  offer_exchange: {
    title: 'Offer an exchange?',
    detail: 'Buyer will see this · TikTok',
    yes: { label: 'Offer exchange', say: { en: 'Yes, offer it', id: 'Boleh, tawarin' } },
    no: NOT_NOW,
  },
  offer_return_label: {
    title: 'Create a return label?',
    detail: 'For the exchange request',
    yes: { label: 'Create label', say: { en: 'Yes, create it', id: 'Iya, buatin' } },
    no: { label: 'Not now', say: { en: 'Not yet', id: 'Nanti dulu' } },
  },
}

/** Kartu persetujuan untuk langkah yang sedang menunggu jawaban (atau null). */
export function cardFor(stepId, lang = 'en') {
  const c = stepId && CARDS[stepId]
  if (!c) return null
  return {
    step: stepId,
    title: c.title,
    detail: c.detail,
    ...(c.orders && { orders: c.orders, skip: [] }),
    yes: { label: c.yes.label, say: L(c.yes.say, lang) },
    no: { label: c.no.label, say: L(c.no.say, lang) },
  }
}

// Ucapan saat aksi dibatalkan, per jenis aksi
const UNDO_SPEECH = {
  label: { en: 'Okay, I canceled that label.', id: 'Oke, labelnya udah aku batalin.' },
  reply: { en: 'Okay, I pulled that message back.', id: 'Oke, pesannya udah aku tarik.' },
  stock: { en: 'Okay, I put the stock back the way it was.', id: 'Oke, stoknya udah aku balikin kayak semula.' },
}
export const undoReply = (kind, lang) =>
  `${L(UNDO_SPEECH[kind] || UNDO_SPEECH.label, lang)} ${lang === 'id' ? 'Ada lagi?' : 'Anything else?'}`
export const nothingToUndo = (lang) =>
  lang === 'id' ? 'Belum ada yang bisa dibatalkan. Ada lagi?' : "There's nothing to undo yet. Anything else?"

/** Info aksi (jenis, teks undo) dari teks toast hasil aksi. */
export const workFor = (toast) => WORK[toast]

// ---------------------------------------------------------------------------
// Antrean rekomendasi: yang belum selesai ditawarkan berikutnya.
// waiting = baris "Still waiting" di ringkasan (UI, bahasa Inggris).
// ---------------------------------------------------------------------------
const QUEUE = [
  {
    key: 'ship',
    step: 'offer_ship',
    lead: { en: 'The urgent orders come first.', id: 'Yang paling mendesak pesanan dulu.' },
    waiting: '4 orders due by 2:00 PM · Rp 740K',
  },
  {
    key: 'chats',
    step: 'offer_chats',
    lead: { en: 'Buyers are waiting on chats.', id: 'Ada pembeli yang nunggu dibalas.' },
    waiting: '4 unanswered size questions',
  },
  {
    key: 'stock',
    step: 'offer_stock',
    lead: { en: 'One item is running low.', id: 'Ada satu barang yang stoknya menipis.' },
    waiting: 'Black hoodie M · only 3 left',
  },
  {
    key: 'complaint',
    step: 'offer_exchange',
    lead: { en: 'A complaint needs a reply.', id: 'Ada komplain yang perlu dibalas.' },
    waiting: '1 complaint about color · TikTok',
  },
]

const askOf = (id, lang) => rnd(L(STEPS[id].ask, lang))

// Yang ada di cakupan tab aktif ditawarkan lebih dulu, baru sisanya
function nextSuggestion(done, lang, scope = []) {
  const item = QUEUE.find((q) => scope.includes(q.key) && !done.includes(q.key)) || QUEUE.find((q) => !done.includes(q.key))
  if (!item) return null
  return { step: item.step, line: `${L(item.lead, lang)} ${askOf(item.step, lang)}` }
}

const ALL_DONE = {
  en: "That covers the urgent stuff. Anything else you'd like to check?",
  id: 'Yang mendesak udah beres semua. Ada lagi yang mau dicek?',
}
// Bahasa diganti di tengah sesi: konfirmasi singkat, lalu ulangi pertanyaan yang menunggu
const SWITCHED = { en: "Sure, let's continue in English.", id: 'Oke, kita lanjut pakai Bahasa Indonesia ya.' }
export const switchedLine = (lang) => L(SWITCHED, lang)
export function switchTo(lang, ctx) {
  const head = L(SWITCHED, lang)
  if (ctx.pending && STEPS[ctx.pending]) return { ...two(head, askOf(ctx.pending, lang)), ctx }
  const s = nextSuggestion(ctx.done, lang, ctx.scope)
  if (s) return { ...two(head, s.line), ctx: { ...ctx, pending: s.step } }
  return { ...two(`${head} ${L(ALL_DONE, lang).split('. ').pop()}`), ctx }
}
// Pindah dari Chat ke Voice: lanjutkan percakapan yang sama, tanpa membacakan briefing lagi
const RESUMED = { en: 'Picking up from chat.', id: 'Lanjut dari chat ya.' }
export function resumeFrom(lang, ctx) {
  const head = L(RESUMED, lang)
  if (ctx.pending && STEPS[ctx.pending]) return { ...two(head, askOf(ctx.pending, lang)), ctx }
  const s = nextSuggestion(ctx.done, lang, ctx.scope)
  if (s) return { ...two(head, s.line), ctx: { ...ctx, pending: s.step } }
  return { ...two(`${head} ${L(ALL_DONE, lang)}`), ctx }
}
const CONNECT = { en: ['Next up:', 'One more thing:', 'While we are at it:'], id: ['Selanjutnya,', 'Satu lagi,', 'Sekalian,'] }

// "Selanjutnya," diikuti huruf kecil; "Next up:" tetap huruf besar
const join = (connector, line) =>
  connector.endsWith(',') ? `${connector} ${line.charAt(0).toLowerCase()}${line.slice(1)}` : `${connector} ${line}`

/**
 * Jawaban dua bagian. reply = kalimat utuh untuk suara (dengan kata sambung),
 * parts = { body, next } untuk chat: body = hasil atau informasi, next = tawaran berikutnya.
 * Chat menampilkan next sebagai paragraf sendiri, jadi kata sambungnya tidak perlu.
 */
const two = (body, next, connector) => ({
  reply: next ? `${body} ${connector ? join(connector, next) : next}` : body,
  parts: { body, next: next || null },
})

// Menyusun jawaban akhir + menentukan langkah berikutnya.
function conclude(out, ctx, lang) {
  const done = out.mark && !ctx.done.includes(out.mark) ? [...ctx.done, out.mark] : ctx.done
  const body = L(out.reply, lang)
  let said
  let pending = null
  if (out.next === 'SUGGEST') {
    const s = nextSuggestion(done, lang, ctx.scope)
    said = s ? two(body, s.line) : two(`${body} ${L(ALL_DONE, lang)}`)
    pending = s ? s.step : null
  } else if (out.next) {
    said = two(body, askOf(out.next, lang))
    pending = out.next
  } else {
    const s = nextSuggestion(done, lang, ctx.scope)
    said = s ? two(body, s.line, rnd(CONNECT[lang] || CONNECT.en)) : two(`${body} ${L(ALL_DONE, lang)}`)
    pending = s ? s.step : null
  }
  return { ...said, toast: out.toast, work: out.work || (out.toast ? WORK[out.toast] : undefined), ctx: { ...ctx, pending, done } }
}

// User meminta aksi langsung. Aksi yang terlihat pembeli dan label pengiriman selalu minta izin dulu;
// aksi internal lainnya mengikuti toggle Ask Me First.
function requestAction(stepId, askFirst, ctx, lang) {
  if (askFirst || STEPS[stepId].buyer || STEPS[stepId].review) {
    const lead = lang === 'id' ? rnd(['Siap.', 'Boleh.']) : rnd(['Sure.', 'Happy to.'])
    return { ...two(lead, askOf(stepId, lang)), ctx: { ...ctx, pending: stepId } }
  }
  const out = conclude(STEPS[stepId].yes, ctx, lang)
  const lead = lang === 'id' ? rnd(['Oke, aku kerjakan.', 'Siap, langsung aku kerjakan.']) : rnd(['On it.', 'Sure thing.'])
  const strip = (x) => x.replace(/^(Done|Beres)\.\s*/, '')
  return { ...out, reply: `${lead} ${strip(out.reply)}`, parts: { ...out.parts, body: `${lead} ${strip(out.parts.body)}` } }
}

// ---------------------------------------------------------------------------
// Topik informasi: tiap mode punya gaya sendiri, ditutup tawaran bantuan.
// ---------------------------------------------------------------------------
const TOPICS = {
  orders: {
    step: 'offer_ship',
    en: {
      brief: '18 orders need to ship today. The 4 due by 2 PM matter most, because late shipping hurts your shop rating.',
      think:
        "There are 18 orders today. 4 are due by 2 PM, 3 on Shopee and 1 on TikTok. Missing that cutoff costs you shop rating, while the other 14 have until tonight. So I'd clear the urgent 4 first, then batch the rest.",
      guide:
        "Here's how to get through today's orders. First, ship the 4 due by 2 PM. Second, print labels for the other 14 in one batch. Third, hand everything to the courier at once. I can do the first step now.",
    },
    id: {
      brief: 'Ada 18 pesanan yang harus dikirim hari ini. Yang paling penting 4 pesanan dengan batas jam 2 siang, karena telat kirim bisa nurunin rating toko.',
      think:
        'Hari ini ada 18 pesanan. 4 harus dikirim sebelum jam 2 siang, 3 dari Shopee dan 1 dari TikTok. Kalau lewat batas, rating toko bisa turun, sedangkan 14 sisanya masih aman sampai malam. Jadi aku sarankan beresin 4 yang mendesak dulu, baru sisanya sekaligus.',
      guide:
        'Begini urutannya. Pertama, kirim 4 pesanan yang batasnya jam 2 siang. Kedua, cetak label buat 14 pesanan lainnya sekaligus. Ketiga, serahkan semuanya ke kurir dalam sekali jalan. Langkah pertama bisa aku kerjakan sekarang.',
    },
  },
  chats: {
    step: 'offer_chats',
    en: {
      brief: '6 chats are waiting, and 4 are asking about sizes. Quick replies there usually turn into orders.',
      think:
        '6 chats are unanswered. 4 are size questions, which are easy to answer and close to buying. 1 is a complaint and 1 is a general question. Replying to the size questions first gets you the quickest sales.',
      guide:
        "Here's how to clear your chats. First, answer the 4 size questions with your size chart. Second, handle the complaint. Third, reply to the last general question. I can do the first one for you.",
    },
    id: {
      brief: 'Ada 6 chat yang nunggu, 4 di antaranya nanya ukuran. Kalau cepat dibalas, biasanya langsung jadi pesanan.',
      think:
        'Ada 6 chat belum dibalas. 4 soal ukuran, gampang dijawab dan biasanya udah mau beli. 1 komplain dan 1 pertanyaan umum. Balas yang soal ukuran dulu, itu paling cepat jadi penjualan.',
      guide:
        'Begini cara beresin chat. Pertama, balas 4 pertanyaan ukuran pakai size chart. Kedua, tangani komplainnya. Ketiga, balas satu pertanyaan umum yang tersisa. Yang pertama bisa aku bantu.',
    },
  },
  stock: {
    step: 'offer_stock',
    en: {
      brief: 'The black hoodie in M is down to 3 and sold 9 yesterday. If both shops still show old stock, you could sell more than you have.',
      think:
        'The black hoodie in M has 3 left and sells about 9 a day, so it could run out today. The real risk is overselling, because Shopee and TikTok each think they have more. Syncing stock now is the safe move, then plan a restock.',
      guide:
        "Here's what I'd do. First, sync the stock on both shops. Second, check whether other sizes are running low. Third, plan a restock for the weekend. I can do the sync now.",
    },
    id: {
      brief: 'Hoodie hitam size M tinggal 3, kemarin laku 9. Kalau stok di dua toko belum sama, bisa kejual lebih dari yang ada.',
      think:
        'Hoodie hitam size M sisa 3, sehari laku sekitar 9, jadi bisa habis hari ini. Risikonya oversell, karena Shopee dan TikTok masing-masing masih mengira stoknya lebih banyak. Paling aman samain stoknya sekarang, lalu rencanakan restock.',
      guide:
        'Begini langkahnya. Pertama, samain stok di kedua toko. Kedua, cek apakah ukuran lain juga menipis. Ketiga, rencanakan restock buat akhir pekan. Sinkron stoknya bisa aku kerjakan sekarang.',
    },
  },
  complaint: {
    step: 'offer_exchange',
    en: {
      brief: 'One buyer on TikTok says the color looks different from the photo. Offering an exchange quickly usually keeps the review positive.',
      think:
        "One buyer says the color looks different from the photo. A refund closes it fast but loses the sale, while an exchange keeps the sale and usually the good review. I'd offer the exchange.",
      guide:
        "Here's how to handle it. First, apologize and offer an exchange. Second, create a return label once they agree. Third, ship the new color. I can send the first reply.",
    },
    id: {
      brief: 'Ada pembeli di TikTok yang bilang warnanya beda dari foto. Kalau cepat ditawari tukar, biasanya ulasannya tetap bagus.',
      think:
        'Ada pembeli yang bilang warnanya beda dari foto. Refund memang cepat selesai tapi penjualannya hilang, sedangkan tukar barang menyelamatkan penjualan dan biasanya ulasannya tetap bagus. Aku sarankan tawarin tukar.',
      guide:
        'Begini cara menanganinya. Pertama, minta maaf dan tawarin tukar barang. Kedua, buatin label retur setelah dia setuju. Ketiga, kirim warna yang baru. Balasan pertamanya bisa aku kirim.',
    },
  },
  // Rekap: informasi saja, tanpa aksi. Setelahnya assistant menawarkan rekomendasi berikutnya.
  recap: {
    step: null,
    en: {
      brief: 'Yesterday you had 31 orders worth 4.2 million rupiah. TikTok brought in 60 percent.',
      think:
        'Yesterday you had 31 orders worth 4.2 million rupiah, and 60 percent came from TikTok. Your live sessions are pulling more weight than your Shopee listings, so it may be worth going live again tonight.',
      guide:
        "Here's yesterday in short. First, 31 orders came in. Second, they were worth 4.2 million rupiah. Third, TikTok brought in 60 percent.",
    },
    id: {
      brief: 'Kemarin ada 31 pesanan dengan total 4,2 juta. 60 persennya dari TikTok.',
      think:
        'Kemarin ada 31 pesanan dengan total 4,2 juta, dan 60 persennya dari TikTok. Live di TikTok kelihatannya lebih ngangkat penjualan dibanding listing Shopee, jadi mungkin layak live lagi malam ini.',
      guide: 'Ringkasnya begini. Pertama, ada 31 pesanan. Kedua, totalnya 4,2 juta. Ketiga, 60 persennya dari TikTok.',
    },
  },
}

function topicReply(key, mode, ctx, lang) {
  const t = TOPICS[key]
  const set = t[lang] || t.en
  const body = set[mode] || set.brief
  // Topik sudah menjelaskan masalahnya, jadi pakai pertanyaan versi pendek supaya tidak berulang
  if (t.step) return { ...two(body, L(STEPS[t.step].short, lang) || askOf(t.step, lang)), ctx: { ...ctx, pending: t.step } }
  const s = nextSuggestion(ctx.done, lang, ctx.scope)
  return s
    ? { ...two(body, s.line, rnd(CONNECT[lang] || CONNECT.en)), ctx: { ...ctx, pending: s.step } }
    : { ...two(body), ctx: { ...ctx, pending: null } }
}

// ---------------------------------------------------------------------------
// Utilitas pencocokan (bahasa Inggris dan Indonesia santai)
// ---------------------------------------------------------------------------
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$' ]/g, ' ').replace(/\s+/g, ' ').trim()
const any = (t, list) => list.some((w) => new RegExp(`\\b${w}\\b`).test(t))

// Jawaban ya/tidak. Urutannya penting: penolakan yang jelas ("ya nggak usah", "nanti aja") dicek
// dulu, lalu persetujuan di mana pun dalam kalimat ("iya, kerjakan", "oke gas", "gak papa"),
// lalu kata pembuka ("nggak", "iya"). Huruf yang dipanjangkan ("iyaaa", "gasss", "siapp") ikut cocok.
const NO_ANY =
  /\b(not now|not yet|not today|never mind|nevermind|maybe later|no thanks|no thank you|leave it|skip (it|that|this)|hold off|don't do (it|that)|please don't|(n?g+a+k?|e+n+g+g?a+k?|ti+d+a+k|nda+k|ka+ga+k) ?(usah|perlu|dulu|jadi|mau|bisa|boleh|sekarang)|gausah|tidak perlu|jangan(?! lupa)|nanti (aja|saja|dulu|ya|deh|lagi)|ntar (aja|dulu)|entar (aja|dulu)|lain kali|belum (dulu|perlu|sekarang|usah)|tunda( dulu)?|lewati|lewatin|skip aja|batal)\b/
const YES_ANY =
  /\b(gas+|gas+(kan|keun|in)|oke+ gas+|sikat|hajar|eksekusi|kerjakan|kerjain|lakukan|lakuin|jalankan|jalanin|prosesin|proses aja|langsung (aja|saja|kerjakan|kerjain)|kirim aja|bikin aja|buat aja|boleh( banget| deh| dong| aja)?|(n?g+a+k?|e+n+g+g?a+k?) ?(papa|apa apa|apa2|masalah)|gapapa|tidak (apa apa|masalah)|no (problem|worries)|go ahead|do it|go for it|let'?s do it|let'?s go|sounds good|that works|sure thing|of course|why not|please do|make it happen|proceed|send it|yes please)\b/
const NO_START =
  /^(no+|nope|nah|don'?t|do not|skip|n?g+a+k?|e+n+g+g?a+k?|ti+d+a+k|nda+k|ka+ga+k|belum)\b/
const YES_START =
  /^(yes+|yeah|yea|yep|yup|sure|ok+|okay|okey|ok+e+|oke+h|okelah|oke deh|alright|all right|right|correct|fine|absolutely|definitely|certainly|i+y+a+h?|ya+h?|ye+|yo+i|ay+o+k?|a+y+u+k|yu+k|hayu+k|ku+y|cu+s|si+p+|sia+p+|tentu|betul|bener|benar|setuju|lanjut(kan)?|monggo|mangga|silah?kan|ya ?udah|udah gas)\b/
// Kata yang hanya berarti "ya" kalau diucapkan sendiri ("mau tanya stok" bukan persetujuan)
const YES_ALONE = /^(mau|bisa|please|langsung|proses)( dong| deh| banget| ya| aja| saja)?$/

/** 'yes', 'no', atau null kalau kalimat ini bukan jawaban ya/tidak. */
export function replyKind(text) {
  const t = norm(text)
  if (!t) return null
  if (NO_ANY.test(t)) return 'no'
  if (YES_ANY.test(t)) return 'yes'
  if (NO_START.test(t)) return 'no'
  if (YES_START.test(t) || YES_ALONE.test(t)) return 'yes'
  return null
}

const UNDO = /\b(undo|take (that|it) back|revert that|cancel that|batalin|batalkan|nggak jadi|gak jadi|ga jadi|enggak jadi|tidak jadi|ga jadi deh)\b/
const BYE = [
  'goodbye', 'bye', 'hang up', "that's all", 'end call', 'end the call',
  'udah dulu', 'sudah dulu', 'udahan', 'cukup', 'cukup dulu', 'dadah', 'dah dulu', 'makasih udah', 'makasih ya udah',
]
const THANKS = ['thanks', 'thank you', 'cheers', 'makasih', 'terima kasih', 'trims', 'tengkyu']

const ELSEWHERE = { en: 'Outside this view:', id: 'Di luar itu,' }
// Tawaran yang sama dengan pertanyaan yang masih menunggu: cukup diingatkan, tidak diulang utuh
const REMIND = {
  offer_ship: { en: 'The 4 shipping labels are still waiting. Get them ready now?', id: '4 label pengiriman masih menunggu. Mau aku siapin sekarang?' },
  offer_chats: { en: 'The 4 size questions in Chats are still waiting. Reply now?', id: '4 pertanyaan ukuran di Chats masih menunggu. Mau aku balas sekarang?' },
  offer_stock: { en: 'The black hoodie stock is still waiting. Sync it now?', id: 'Stok hoodie hitam masih menunggu. Mau aku samain sekarang?' },
  offer_exchange: { en: 'The color complaint is still waiting. Offer an exchange now?', id: 'Komplain warna masih menunggu. Mau aku tawarin tukar sekarang?' },
}
// Tab diganti di tengah call: konfirmasi singkat, lalu briefing tab baru
const SWITCHED_TAB = { en: (n) => `Okay, switching to ${n}.`, id: (n) => `Oke, pindah ke ${n}.` }

/**
 * Briefing pembuka + tawaran pertama untuk sebuah tab.
 * done = yang sudah ditangani di sesi ini (dilewati), switched = dipanggil karena tab diganti saat call.
 * chat = tab diganti di mode Chat: tanpa kalimat "switching to" (sudah ada pemisah tab),
 * dan pending = pertanyaan yang masih menunggu, supaya tidak diulang utuh.
 */
export function openingFor(tab, lang = 'en', { done = [], switched = false, chat = false, pending = null } = {}) {
  const scope = scopeOf(tab)
  const custom = tab && typeof tab === 'object'
  const handWritten = !custom && !done.length // briefing tab bawaan di awal sesi
  const b = handWritten ? briefingFor(lang, tab) : factBriefing(scope, done, lang, custom ? tab.shop : undefined)
  let brief = (b.lead + b.tail).replace(/\.{2,}$/, '.')
  if (chat && (brief === L(ALL_HANDLED, lang) || brief === L(NOTHING_HERE, lang))) {
    brief = L(brief === L(ALL_HANDLED, lang) ? ALL_HANDLED_IN : NOTHING_IN, lang)(tabName(tab))
  }
  if (switched) brief = `${(SWITCHED_TAB[lang] || SWITCHED_TAB.en)(tabName(tab))} ${brief}`
  const ctx = { pending: null, done, scope }
  const item = QUEUE.find((q) => scope.includes(q.key) && !done.includes(q.key))
  if (item) {
    // Briefing dari fakta sudah menyebut masalahnya, jadi pakai pertanyaan versi pendek
    const ask = handWritten ? askOf(item.step, lang) : L(STEPS[item.step].short, lang) || askOf(item.step, lang)
    return { ...two(brief, ask), ctx: { ...ctx, pending: item.step } }
  }
  // Tidak ada yang bisa dikerjakan di tab ini: tawarkan hal penting di luar cakupannya
  const s = nextSuggestion(done, lang)
  if (s) {
    const line = chat && s.step === pending && REMIND[s.step] ? L(REMIND[s.step], lang) : s.line
    return { ...two(brief, line, L(ELSEWHERE, lang)), ctx: { ...ctx, pending: s.step } }
  }
  return { ...two(`${brief} ${L(ALL_DONE, lang).split('. ').pop()}`), ctx }
}

/**
 * respond({ text, mode, askFirst, tab, ctx, lang })
 * -> { reply, ctx, toast?, work?, endCall?, undo? }
 */
// Hasil "ya" untuk label pengiriman, mengikuti pesanan yang masih dicentang
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`
function shipYes(skip, ctx, lang) {
  const picked = DUE_ORDERS.filter((o) => !skip.includes(o.id))
  if (picked.length === DUE_ORDERS.length) return conclude(STEPS.offer_ship.yes, ctx, lang)
  if (!picked.length) {
    // Semua pesanan dilepas centangnya: belum ada yang bisa dibuat
    const body = {
      en: 'No orders are selected yet. Tick at least one, or say not now.',
      id: 'Belum ada pesanan yang dicentang. Centang minimal satu, atau bilang nanti aja.',
    }
    return { ...two(L(body, lang)), ctx: { ...ctx, pending: 'offer_ship' } }
  }
  const n = picked.length
  const sp = picked.filter((o) => o.shop === 'Shopee').length
  const tt = n - sp
  // Satu toko saja: "all for Shopee", bukan "3 for Shopee"
  const only = !sp ? 'TikTok' : !tt ? 'Shopee' : null
  const shopsEn = only ? `all for ${only}` : `${sp} for Shopee and ${tt} for TikTok`
  const shopsId = only ? `semuanya ${only}` : `${sp} Shopee dan ${tt} TikTok`
  const left = DUE_ORDERS.length - n
  const toast = `${count(n, 'shipping label', 'shipping labels')} ready`
  return conclude(
    {
      reply: {
        en: `Done. ${n === 1 ? `The ${only} shipping label is ready` : `${n} shipping labels are ready, ${shopsEn}`}. I left ${count(left, 'order', 'orders')} out for now.`,
        id: `Beres. ${n === 1 ? `Label pengiriman ${only} udah siap` : `${n} label pengiriman udah siap, ${shopsId}`}. ${left} pesanan aku lewati dulu.`,
      },
      toast,
      work: {
        ...WORK['4 shipping labels ready'],
        steps: ['Checked ship-by times', `Grouped ${count(n, 'urgent order', 'urgent orders')}`, `Created ${count(n, 'shipping label', 'shipping labels')}`],
        detail: `${[sp && `${sp} Shopee`, tt && `${tt} TikTok`].filter(Boolean).join(', ')} · ${count(left, 'order', 'orders')} skipped`,
      },
      mark: 'ship',
    },
    ctx,
    lang,
  )
}

/** skip = nomor pesanan yang dilepas centangnya di daftar label pengiriman. */
export function respond({ text, mode, askFirst, tab, ctx: prev, lang = 'en', skip = [] }) {
  const t = norm(text)
  const ctx = prev || { pending: null, done: [] }
  const id = lang === 'id'

  // 0) Batalkan aksi terakhir ("undo that" / "batalin"); eksekusinya ada di useVoiceChat
  if (UNDO.test(t)) {
    return { undo: true, reply: '', ctx: { ...ctx, pending: null } }
  }

  // 1) Jawaban untuk tawaran / pertanyaan sebelumnya
  if (ctx.pending && STEPS[ctx.pending]) {
    const step = STEPS[ctx.pending]
    const kind = replyKind(t)
    if (kind === 'yes' && ctx.pending === 'offer_ship') return shipYes(skip, ctx, lang)
    if (kind === 'yes') return conclude(step.yes, ctx, lang)
    if (kind === 'no') return conclude(step.no, ctx, lang)
  }

  // 2) Percakapan umum
  if (any(t, BYE)) {
    return { reply: id ? 'Oke, sampai nanti ya.' : 'Okay, talk soon.', endCall: true, ctx: { ...ctx, pending: null } }
  }
  if (any(t, THANKS)) {
    const s = nextSuggestion(ctx.done, lang, ctx.scope)
    const thanks = id ? 'Sama-sama.' : 'Anytime.'
    return {
      ...(s ? two(thanks, s.line) : two(`${thanks} ${id ? 'Aku standby kalau butuh apa-apa.' : "I'm here if you need anything else."}`)),
      ctx: { ...ctx, pending: s ? s.step : null },
    }
  }
  if (/^(hi|hello|hey|good morning|good afternoon|halo|hai|hallo|pagi|siang|sore|selamat pagi|selamat siang)\b/.test(t)) {
    return { ...two(id ? 'Halo!' : 'Hi!', askOf('offer_suggest', lang)), ctx: { ...ctx, pending: 'offer_suggest' } }
  }
  if (t.includes('what can you do') || t.includes('bisa apa') || any(t, ['help', 'help me', 'bantu', 'bantuin'])) {
    const intro = id
      ? 'Aku bisa cek pesanan, chat, dan stok di Shopee dan TikTok Shop, kasih saran harus ngapain dulu, dan langsung kerjakan begitu kamu bilang iya.'
      : 'I can check your orders, chats, and stock on Shopee and TikTok Shop, suggest what to do next, and take care of it once you say yes.'
    return { ...two(intro, askOf('offer_suggest', lang)), ctx: { ...ctx, pending: 'offer_suggest' } }
  }

  // 3) Minta rekomendasi
  if (
    /what should i (do|start|focus)|recommend|suggest|prioriti[sz]e|where (do i|should i) start|what'?s next|what else|anything else|tell me more|\bnext\b|mulai dari mana|apa dulu|ngapain dulu|saran|selanjutnya|terus apa|apa lagi|yang penting/.test(t)
  ) {
    return conclude({ reply: id ? rnd(['Kalau aku, begini.', 'Saranku:']) : rnd(['Here is what I would do.', 'My suggestion:']), next: 'SUGGEST' }, ctx, lang)
  }

  // 4) User meminta aksi langsung
  if (any(t, ['label', 'labels', 'resi', 'shipping', 'ship', 'pengiriman']) && any(t, ['create', 'make', 'print', 'prepare', 'get', 'siapkan', 'siapin', 'buat', 'bikin', 'cetak', 'print'])) {
    return requestAction('offer_ship', askFirst, ctx, lang)
  }
  if (any(t, ['reply', 'answer', 'respond', 'balas', 'bales', 'jawab']) && any(t, ['chat', 'chats', 'message', 'messages', 'pesan', 'pembeli', 'buyer', 'buyers', 'size', 'ukuran'])) {
    return requestAction('offer_chats', askFirst, ctx, lang)
  }
  if (any(t, ['sync', 'update', 'samakan', 'sinkron', 'sinkronkan', 'perbarui', 'samain']) && any(t, ['stock', 'stok'])) {
    return requestAction('offer_stock', askFirst, ctx, lang)
  }
  if (any(t, ['exchange', 'tukar', 'return', 'retur']) && any(t, ['offer', 'tawarkan', 'tawarin', 'kasih', 'handle', 'urus', 'send', 'kirim'])) {
    return requestAction('offer_exchange', askFirst, ctx, lang)
  }

  // 5) Informasi + rekomendasi
  if (any(t, ['complaint', 'komplain', 'return', 'retur', 'exchange', 'tukar', 'refund', 'beda warna', 'warna'])) return topicReply('complaint', mode, ctx, lang)
  if (any(t, ['recap', 'sales', 'revenue', 'yesterday', 'rekap', 'omzet', 'omset', 'penjualan', 'kemarin', 'laporan'])) return topicReply('recap', mode, ctx, lang)
  // chat dicek sebelum stok: "chat soal ukuran" = chat, "stok size M" = stok
  if (any(t, ['chat', 'chats', 'message', 'messages', 'pesan', 'balas', 'pertanyaan', 'questions', 'unanswered'])) return topicReply('chats', mode, ctx, lang)
  if (any(t, ['stock', 'stok', 'size', 'ukuran', 'habis', 'restock', 'sold out', 'hoodie'])) return topicReply('stock', mode, ctx, lang)
  if (any(t, ['order', 'orders', 'pesanan', 'orderan', 'resi', 'kirim', 'ship', 'shipping', 'label', 'labels', 'courier', 'kurir'])) return topicReply('orders', mode, ctx, lang)
  if (any(t, ['summary', 'brief me', 'overview', 'catch me up', "what's up", 'whats up', 'update', 'ringkasan', 'gimana', 'kabar'])) {
    const o = openingFor(tab, lang, { done: ctx.done })
    return { reply: o.reply, parts: o.parts, ctx: { ...ctx, pending: o.ctx.pending } }
  }

  // 6) Ya/tidak tanpa konteks
  if (replyKind(t) === 'yes') {
    return { ...two(id ? 'Siap bantu.' : 'Happy to help.', askOf('offer_suggest', lang)), ctx: { ...ctx, pending: 'offer_suggest' } }
  }

  return {
    ...two(
      id ? 'Aku asisten demo, jadi cuma bisa bantu soal pesanan, chat, dan stok.' : "I'm a demo assistant, so I stick to orders, chats, and stock.",
      askOf('offer_suggest', lang)
    ),
    ctx: { ...ctx, pending: 'offer_suggest' },
  }
}

// ---------------------------------------------------------------------------
// Ringkasan sesi (UI, bahasa Inggris)
// ---------------------------------------------------------------------------

/** Baris "Still waiting": yang belum ditangani lewat aksi di sesi ini (ditolak = masih menunggu). */
export function stillWaiting(handled = []) {
  const rows = QUEUE.filter((q) => !handled.includes(q.key)).map((q) => q.waiting)
  // 6 chat belum dibalas: 4 soal ukuran (ditangani skenario chats), 1 komplain, 1 pertanyaan umum
  rows.push('1 general question in chats')
  return rows
}

/** Satu hal untuk dicek besok. */
export function checkTomorrow(handled = []) {
  if (handled.includes('complaint')) return 'See which color the buyer picked for the exchange'
  return 'Restock the black hoodie in M before the weekend'
}
