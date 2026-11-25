import { useCallback, useEffect, useRef, useState } from 'react'
import { getSR, isVoiceSupported, primeSpeech, speak, createMicMeter } from './speech.js'
import { respond, openingFor, cardFor, stillWaiting, checkTomorrow, undoReply, nothingToUndo, switchTo, switchedLine, tabName, replyKind, resumeFrom, DUE_ORDERS } from './brain.js'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
// Tempo langkah kerja Live actions (ms): cukup lambat untuk terbaca, tidak bikin menunggu
const STEP_MS = () => 520 + Math.random() * 380
const SETTLE_MS = 260 // jeda setelah aksi selesai sebelum assistant bicara
const BRIEF_FADE_MS = 160 // briefing tab yang diganti memudar dulu; sama dengan --dur-fast di .chatcard__item
const formatClock = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`

// Toast aksi demo -> item "Actions taken" di ringkasan sesi.
// Jenis aksi dan teks undo datang dari WORK di brain.js.
function toAction(toast, work) {
  return {
    label: toast.charAt(0).toUpperCase() + toast.slice(1),
    key: work?.key || null,
    kind: work?.kind || 'label',
    undone: work?.undone || 'Action undone',
  }
}
const undoneText = (a) => a.undone

/**
 * Mesin status voice chat:
 * idle -> connecting -> listening <-> thinking -> speaking -> listening ... -> ended
 * Semua nilai yang dibaca callback async diambil dari ref agar tidak basi.
 */
export default function useVoiceChat({ tab, aiMode, askFirst, voiceLang = 'en', onToast, isFeedVisible, actionsInChat }) {
  const [status, setStatus] = useState('idle')
  const [muted, setMuted] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [caption, setCaption] = useState(null) // { who, lead, tail }
  const [notes, setNotes] = useState(0)
  const [summary, setSummary] = useState(null) // ringkasan sesi terakhir
  const [supported] = useState(isVoiceSupported)
  // Live actions: { id, kind, status: running|done|undone|note, title, doneTitle, detail, steps, step, t, doneAt }
  const [feed, setFeed] = useState([])
  const [waiting, setWaiting] = useState(null) // kartu "Needs your OK"
  const [working, setWorking] = useState(false)
  // Percakapan bersama mode Chat dan Voice: { id, who: 'user' | 'ai' | 'note', text, via: 'chat' | 'voice' }
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false) // assistant sedang menyusun balasan chat
  const [spoken, setSpoken] = useState(null) // { id, n }: bagian pesan yang sudah diucapkan saat call

  const live = useRef({})
  live.current = { ...live.current, tab, aiMode, askFirst, voiceLang, onToast, isFeedVisible, actionsInChat, muted, seconds }

  const r = useRef({
    active: false,
    status: 'idle',
    rec: null,
    cancelSpeech: null,
    meter: null,
    ctx: { pending: null, done: [] },
    thinkTimer: null,
    bump: 0,
    pulse: 0,
    restarts: [],
    // catatan sesi untuk ringkasan
    log: [], // { who: 'user' | 'ai' | 'note', text, t }
    actions: [], // { id, label, kind, mark, followUp }
    actionSeq: 0,
    noteSeq: 0,
    workTimers: [],
    skip: [], // pesanan yang dilepas centangnya di kartu label pengiriman
    finishWork: null, // menuntaskan aksi yang sedang berjalan (dipakai saat sesi diakhiri)
    netErrors: 0,
    startedAt: 0,
    mode: 'brief',
    lang: 'en', // bahasa percakapan; bisa diganti di tengah sesi
    ending: false, // ucapan pamit sedang berjalan, sesi berakhir setelahnya
    announceLang: false, // bahasa diganti saat assistant berpikir: konfirmasi di awal jawaban berikutnya
    tabAtStart: 'Everything',
    msgSeq: 0,
    chatStarted: false, // percakapan chat sudah dibuka (pesan pembuka sudah tampil)
    chatTimer: null,
  })

  // extra (opsional): parts { body, next } untuk tampilan chat
  const pushMsg = (who, text, via, extra) => {
    if (!text) return null
    const id = ++r.current.msgSeq
    setMessages((m) => [...m, { id, who, text, via, ...extra }])
    return id
  }

  // Catatan call (untuk ringkasan) sekaligus bubble di percakapan chat
  const record = (who, text) => {
    if (!text) return null
    r.current.log.push({ who, text, t: live.current.seconds || 0 })
    return pushMsg(who, text, 'voice')
  }

  // Waktu item feed: detik call saat voice, jam saat chat tanpa call
  const stamp = () =>
    r.current.active ? live.current.seconds || 0 : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const go = (s) => {
    r.current.status = s
    setStatus(s)
  }
  const toast = (msg) => live.current.onToast?.(msg)
  const patchItem = (id, patch) => setFeed((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  // Aksi sedang terlihat: feed Actions di layar, atau kartu aksi di percakapan (mode Chat di HP)
  const feedShown = () => !!live.current.actionsInChat || !!live.current.isFeedVisible?.()
  const showWaiting = () => {
    const card = cardFor(r.current.ctx.pending, r.current.lang)
    setWaiting((w) => {
      if (!card) return null
      // bahasa berganti: kartu disusun ulang, centang pesanan tetap
      if (w && w.step === card.step) return w.yes.say === card.yes.say ? w : { ...card, t: w.t, skip: w.skip }
      r.current.skip = [] // kartu baru: semua pesanan dicentang lagi
      return { ...card, t: stamp() }
    })
  }

  /** Centang atau lepas satu pesanan di daftar label pengiriman. */
  function toggleOrder(id) {
    const s = r.current
    s.skip = s.skip.includes(id) ? s.skip.filter((x) => x !== id) : [...s.skip, id]
    const skip = s.skip
    setWaiting((w) => (w && w.orders ? { ...w, skip } : w))
  }

  const micBlockedToast = () => ({
    kind: 'error',
    key: 'err:mic',
    text: 'Allow microphone access, then retry',
    action: { label: 'Retry', onClick: () => start() },
  })

  function stopRecognition() {
    const rec = r.current.rec
    r.current.rec = null
    if (!rec) return
    rec.onresult = rec.onerror = rec.onend = rec.onstart = null
    try {
      rec.abort()
    } catch {
      /* abaikan */
    }
  }

  /** Batalkan satu aksi: hapus dari daftar, buka lagi rekomendasinya. */
  function undoAction(id) {
    const s = r.current
    const a = s.actions.find((x) => x.id === id)
    if (!a) return null
    s.actions = s.actions.filter((x) => x.id !== id)
    if (a.mark) s.ctx = { ...s.ctx, done: s.ctx.done.filter((m) => m !== a.mark) }
    if (a.followUp && s.ctx.pending === a.followUp) {
      s.ctx = { ...s.ctx, pending: null }
      setWaiting(null)
    }
    setSummary((sum) => {
      if (!sum) return sum
      const actions = sum.actions.filter((x) => x.id !== id)
      if (sum.mode === 'listen') return { ...sum, actions }
      const handled = actions.map((x) => x.key)
      return { ...sum, actions, waiting: stillWaiting(handled), tomorrow: checkTomorrow(handled) }
    })
    patchItem(id, { status: 'undone' })
    return a
  }

  /** Undo dari feed: tanpa toast kalau feed sedang terlihat. */
  function undoFromFeed(id) {
    const a = undoAction(id)
    if (a && !feedShown()) toast({ kind: 'undo', text: undoneText(a) })
  }

  /** Jalankan langkah kerja satu per satu, lalu tandai selesai. */
  function runWork(item, onDone) {
    const s = r.current
    let i = 0
    const finish = () => {
      s.workTimers.forEach(clearTimeout)
      s.workTimers = []
      s.finishWork = null
      setWorking(false)
      patchItem(item.id, { status: 'done', step: item.steps.length, doneAt: Date.now() })
    }
    s.finishWork = finish
    setWorking(true)
    const tick = () => {
      i += 1
      if (i < item.steps.length) {
        patchItem(item.id, { step: i })
        s.workTimers.push(setTimeout(tick, STEP_MS()))
      } else {
        finish()
        s.workTimers.push(setTimeout(onDone, SETTLE_MS))
      }
    }
    s.workTimers.push(setTimeout(tick, STEP_MS()))
  }

  function buildSummary() {
    const s = r.current
    return {
      id: Date.now(),
      startedAt: s.startedAt,
      endedAt: Date.now(),
      duration: live.current.seconds || 0,
      mode: s.mode,
      tab: tabName(s.tabAtStart),
      transcript: [...s.log],
      actions: s.actions.filter((a) => a.at >= s.startedAt),
      notes: s.log.filter((x) => x.who === 'note').map((x) => x.text),
      exchanges: s.log.filter((x) => x.who === 'user' || x.who === 'note').length,
      waiting: s.mode === 'listen' ? [] : stillWaiting(s.actions.map((a) => a.key)),
      tomorrow: s.mode === 'listen' ? null : checkTomorrow(s.actions.map((a) => a.key)),
    }
  }

  /** Toast penutup: "Voice chat ended" (tombol X) atau "Talk soon" (user pamit). */
  function endedToast(reason) {
    const s = r.current
    const notes = s.log.filter((x) => x.who === 'note').length
    const n = s.mode === 'listen' ? notes : s.actions.filter((a) => a.at >= s.startedAt).length
    const unit = s.mode === 'listen' ? 'note' : 'action'
    const detail = n > 0 ? `${n} ${unit}${n === 1 ? '' : 's'} saved` : formatClock(live.current.seconds || 0)
    toast({
      kind: n > 0 ? 'success' : 'ended',
      text: `${reason === 'goodbye' ? 'Talk soon' : 'Voice chat ended'} · ${detail}`,
      key: `ended:${Date.now()}`,
      defer: true,
    })
  }

  function endSession(finalStatus = 'ended', reason = 'user') {
    const s = r.current
    s.finishWork?.()
    s.workTimers.forEach(clearTimeout)
    s.workTimers = []
    setWaiting(null)
    if (finalStatus === 'ended' && s.startedAt) {
      setSummary(buildSummary())
      endedToast(reason)
    }
    s.active = false
    s.ending = false
    s.announceLang = false
    s.retab = false
    setSpoken(null)
    clearTimeout(s.thinkTimer)
    s.cancelSpeech?.()
    s.cancelSpeech = null
    stopRecognition()
    s.meter?.close()
    s.meter = null
    // Percakapan chat tetap berlanjut: yang sudah dikerjakan tetap diingat
    s.ctx = { pending: null, done: s.ctx.done }
    go(finalStatus)
  }

  function say(text, thenEnd = false) {
    const s = r.current
    stopRecognition()
    s.ending = thenEnd
    if (s.announceLang) {
      s.announceLang = false
      if (!thenEnd) text = `${switchedLine(s.lang)} ${text}`
    }
    go('speaking')
    const mid = record('ai', text)
    setCaption({ who: 'ai', lead: '', tail: text })
    setSpoken({ id: mid, n: 0 })
    showWaiting()
    s.cancelSpeech = speak(text, {
      lang: s.lang,
      onProgress: (n, boundary) => {
        if (boundary) s.pulse = 1
        setCaption({ who: 'ai', lead: text.slice(0, n), tail: text.slice(n) })
        setSpoken({ id: mid, n })
      },
      onEnd: () => {
        s.cancelSpeech = null
        setSpoken(null)
        if (!s.active) return
        if (thenEnd) {
          endSession('ended', 'goodbye')
          return
        }
        // Tab diganti saat assistant sedang berpikir: briefing tab baru setelah jawaban ini
        if (s.retab) {
          rebrief()
          return
        }
        go('listening')
        beginListening()
      },
    })
  }

  /**
   * Ucapan pendek seperti "gas" atau "iya" sering salah dengar. Kalau assistant sedang menunggu
   * jawaban ya/tidak dan hasil utama tidak terbaca sebagai jawaban, pakai kemungkinan lain
   * dari recognizer yang terbaca sebagai jawaban.
   */
  function pickHeard(text, result, s) {
    if (!s.ctx?.pending || replyKind(text)) return text
    for (let i = 1; i < result.length; i++) {
      const alt = result[i]?.transcript?.trim()
      if (alt && replyKind(alt)) return alt
    }
    return text
  }

  function handleFinal(text) {
    const s = r.current
    stopRecognition()

    // Listen only: AI diam dan hanya mencatat
    if (live.current.aiMode === 'listen') {
      record('note', text)
      setNotes((n) => n + 1)
      setCaption({ who: 'note', lead: text, tail: '' })
      const id = `note:${++s.noteSeq}`
      setFeed((f) => [{ id, kind: 'note', status: 'note', title: text, t: live.current.seconds || 0 }, ...f])
      setTimeout(beginListening, 250)
      return
    }

    setWaiting(null)
    go('thinking')
    record('user', text)
    setCaption({ who: 'user', lead: text, tail: '' })
    s.thinkTimer = setTimeout(() => {
      if (!s.active) return
      processTurn(text, say)
    }, 450 + Math.random() * 350)
  }

  /**
   * Satu giliran percakapan (dari suara atau ketikan). deliver(reply, endCall, meta) menyampaikan
   * jawabannya: diucapkan saat call, atau jadi bubble chat.
   */
  function processTurn(text, deliver) {
    const s = r.current
    const before = s.ctx
    const turn = {
      text,
      // Listen only hanya berlaku untuk voice; chat memakai Brief answers
      mode: !s.active && live.current.aiMode === 'listen' ? 'brief' : live.current.aiMode,
      askFirst: live.current.askFirst,
      tab: live.current.tab,
      ctx: before,
      lang: s.lang,
      skip: s.skip || [],
    }
    const out = respond(turn)
    s.ctx = out.ctx
    // Daftar pesanan label pengiriman sudah dijawab (atau ditinggal): simpan sebagai catatan
    const shipSnap =
      before.pending === 'offer_ship' && out.ctx.pending !== 'offer_ship' && !out.undo
        ? { list: DUE_ORDERS, skip: [...(s.skip || [])], outcome: out.toast ? 'done' : 'declined' }
        : null
    const freezeOrders = (actionId = null) => {
      if (!shipSnap) return
      // Ditempel ke pesan assistant terakhir, yaitu pesan yang tadi menampilkan daftarnya
      setMessages((m) => {
        const i = m.map((x) => x.who).lastIndexOf('ai')
        if (i < 0) return m
        const copy = m.slice()
        copy[i] = { ...copy[i], orders: { ...shipSnap, actionId } }
        return copy
      })
    }

    // "Undo that": batalkan aksi terakhir
    if (out.undo) {
      const last = s.actions[s.actions.length - 1]
      if (last) {
        undoAction(last.id)
        if (!live.current.actionsInChat) toast({ kind: 'undo', text: undoneText(last) })
        deliver(undoReply(last.kind, s.lang))
      } else {
        deliver(nothingToUndo(s.lang))
      }
      return
    }

    if (out.toast) {
      const a = toAction(out.toast, out.work)
      a.id = ++s.actionSeq
      a.mark = out.ctx.done.find((m) => !before.done.includes(m)) || null
      a.followUp = out.ctx.pending
      a.at = Date.now()
      s.actions.push(a)
      const work = out.work || { title: a.label, steps: [], detail: '' }
      freezeOrders(a.id)
      const item = {
        id: a.id,
        kind: a.kind,
        ...(shipSnap && { orders: shipSnap.list, skip: shipSnap.skip }),
        status: 'running',
        title: work.title,
        doneTitle: a.label,
        detail: work.detail,
        steps: work.steps,
        step: 0,
        t: stamp(),
      }
      setFeed((f) => [item, ...f])
      // Kartu aksi di percakapan (isinya dibaca dari feed lewat actionId)
      pushMsg('action', work.title, s.active ? 'voice' : 'chat', { actionId: a.id })
      // Assistant baru melapor setelah pekerjaannya selesai. Toast hasil aksi tampil,
      // kecuali kartunya sudah terlihat di percakapan.
      runWork(item, () => {
        if (!live.current.actionsInChat) toast({
          kind: 'success',
          text: a.label,
          key: `action:${a.id}`,
          action: { label: 'Undo', onClick: () => undoAction(a.id), after: { text: undoneText(a) } },
        })
        // Bahasa diganti selama aksi berjalan: susun ulang jawabannya dalam bahasa baru
        const final = s.lang === turn.lang ? out : respond({ ...turn, lang: s.lang })
        deliver(final.reply, !!out.endCall, { parts: final.parts })
      })
      return
    }
    freezeOrders()
    deliver(out.reply, !!out.endCall, { parts: out.parts })
  }

  // ---------------------------------------------------------------------------
  // Mode Chat
  // ---------------------------------------------------------------------------

  /** Buka percakapan chat: pesan pembuka sesuai tab, sekali saja. */
  function openChat() {
    const s = r.current
    if (s.chatStarted) return
    s.chatStarted = true
    s.chatTabKey = JSON.stringify(live.current.tab)
    if (s.active) return // call sedang berjalan: transkripnya sudah jadi percakapan
    s.lang = live.current.voiceLang
    const o = openingFor(live.current.tab, s.lang, { done: s.ctx.done })
    s.ctx = { ...o.ctx, done: s.ctx.done }
    pushMsg('ai', o.reply, 'chat', { parts: o.parts })
    showWaiting()
  }

  function chatReply(text, _endCall, meta = {}) {
    const s = r.current
    setTyping(false)
    let parts = meta.parts
    if (s.announceLang) {
      s.announceLang = false
      const head = switchedLine(s.lang)
      text = `${head} ${text}`
      if (parts) parts = { ...parts, body: `${head} ${parts.body}` }
    }
    pushMsg('ai', text, 'chat', { parts })
    showWaiting()
  }

  /** Pesan yang diketik. Saat call berjalan, diperlakukan seperti ucapan (dijawab dengan suara juga). */
  function send(text) {
    const s = r.current
    text = text.trim()
    if (!text) return false
    if (s.active) {
      if (s.status !== 'listening' && s.status !== 'speaking') return false
      s.cancelSpeech?.()
      s.cancelSpeech = null
      handleFinal(text)
      return true
    }
    if (typing || s.finishWork) return false
    if (!s.chatStarted) s.chatTabKey = JSON.stringify(live.current.tab)
    s.chatStarted = true
    s.chatTalked = true // sudah mengobrol: Voice melanjutkan dari sini
    s.lang = live.current.voiceLang
    setWaiting(null)
    pushMsg('user', text, 'chat')
    setTyping(true)
    s.chatTimer = setTimeout(() => processTurn(text, chatReply), 450 + Math.random() * 350)
    return true
  }

  /** Jawaban dari tombol di kartu "Needs your OK", diperlakukan seperti ucapan user. */
  function answer(text) {
    const s = r.current
    if (!s.active) {
      send(text)
      return
    }
    if (s.status !== 'listening' && s.status !== 'speaking') return
    s.cancelSpeech?.()
    s.cancelSpeech = null
    handleFinal(text)
  }

  function beginListening() {
    const s = r.current
    if (!s.active || live.current.muted) return
    if (s.status === 'speaking' || s.status === 'thinking') return
    stopRecognition()

    const rec = new (getSR())()
    rec.lang = s.lang === 'id' ? 'id-ID' : 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.maxAlternatives = 4
    s.rec = rec

    rec.onresult = (e) => {
      if (s.rec !== rec) return
      s.bump = 0.55
      s.netErrors = 0
      const text = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(' ')
        .trim()
      if (!text) return
      setCaption({ who: 'user', lead: text, tail: '' })
      const last = e.results[e.results.length - 1]
      if (last.isFinal) handleFinal(pickHeard(text, last, s))
    }

    rec.onerror = (e) => {
      if (s.rec !== rec) return
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        toast(micBlockedToast())
        endSession('idle')
      } else if (e.error === 'network') {
        s.netErrors += 1
        const again = s.netErrors > 1
        toast({
          kind: 'error',
          key: `err:net:${again ? 2 : 1}`,
          text: again ? 'Still offline. Check your connection' : "Can't reach the speech service",
          action: {
            label: 'Retry',
            onClick: () => {
              if (!r.current.active) return
              r.current.restarts = []
              beginListening()
            },
          },
        })
      }
    }

    rec.onend = () => {
      if (s.rec !== rec) return
      s.rec = null
      if (!s.active || s.status !== 'listening' || live.current.muted) return
      // Hindari loop restart yang terlalu rapat
      const now = Date.now()
      s.restarts = s.restarts.filter((t) => now - t < 3000)
      s.restarts.push(now)
      if (s.restarts.length > 6) {
        toast({
          kind: 'error',
          text: 'Voice keeps cutting out',
          action: { label: 'Retry', onClick: () => r.current.active && live.current.muted && toggleMute() },
        })
        live.current.muted = true
        setMuted(true)
        return
      }
      setTimeout(beginListening, 150)
    }

    try {
      rec.start()
      go('listening')
    } catch {
      /* start ganda: abaikan */
    }
  }

  async function start() {
    const s = r.current
    if (s.active || s.status === 'connecting') return
    if (!supported) {
      toast({ kind: 'error', text: 'Voice needs Chrome, Edge, or Safari' })
      return
    }
    primeSpeech() // harus sinkron di dalam gestur klik
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = Ctx ? new Ctx() : null

    go('connecting')
    setMuted(false)
    live.current.muted = false
    setSeconds(0)
    setNotes(0)
    setCaption(null)
    setSummary(null)
    setWaiting(null)
    clearTimeout(s.chatTimer)
    setTyping(false)
    s.log = []
    s.actions = []
    s.netErrors = 0
    s.startedAt = 0

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (ctx) {
        await ctx.resume().catch(() => {})
        s.meter = createMicMeter(ctx, stream)
      } else {
        stream.getTracks().forEach((t) => t.stop())
      }
    } catch (err) {
      ctx?.close().catch(() => {})
      toast(
        err && err.name === 'NotFoundError'
          ? { kind: 'error', text: 'No microphone found', action: { label: 'Retry', onClick: () => start() } }
          : micBlockedToast()
      )
      go('idle')
      return
    }

    // Sesi dibatalkan (tombol X) saat masih meminta izin mic
    if (s.status !== 'connecting') {
      s.meter?.close()
      s.meter = null
      return
    }

    s.active = true
    // Lanjutan dari chat: pertanyaan yang menunggu tetap dipakai
    if (!s.chatTalked) s.ctx = { pending: null, done: s.ctx.done }
    s.restarts = []
    s.startedAt = Date.now()
    s.mode = live.current.aiMode
    s.lang = live.current.voiceLang
    s.tabAtStart = live.current.tab
    s.tabKey = JSON.stringify(live.current.tab)
    if (live.current.aiMode === 'listen') {
      go('listening')
      beginListening()
    } else {
      // Sudah mengobrol di chat: lanjutkan pertanyaan terakhir, bukan briefing dari awal
      const opening = s.chatTalked
        ? resumeFrom(s.lang, { ...s.ctx, scope: s.ctx.scope || openingFor(live.current.tab, s.lang).ctx.scope })
        : openingFor(live.current.tab, s.lang, { done: s.ctx.done })
      s.ctx = opening.ctx
      say(opening.reply)
    }
  }

  function toggleMute() {
    const s = r.current
    if (!s.active) return
    const next = !live.current.muted
    live.current.muted = next
    setMuted(next)
    if (next) stopRecognition()
    else beginListening()
  }

  // Bahasa diganti di tengah sesi: mic langsung mendengar bahasa baru, lalu assistant
  // mengonfirmasi dan mengulang pertanyaan yang menunggu dalam bahasa baru.
  useEffect(() => {
    const s = r.current
    if (!s.active) {
      // Chat tanpa call: konfirmasi bahasa dan ulangi pertanyaan yang menunggu di percakapan
      if (!s.chatStarted || s.lang === voiceLang) return
      s.lang = voiceLang
      if (typing || s.finishWork) {
        s.announceLang = true
        return
      }
      const out = switchTo(s.lang, s.ctx)
      s.ctx = out.ctx
      chatReply(out.reply, false, { parts: out.parts })
      return
    }
    if (s.lang === voiceLang) return
    s.lang = voiceLang
    if (live.current.aiMode === 'listen') {
      if (s.status === 'listening') beginListening()
      return
    }
    if (s.ending) return
    // Sedang berpikir atau menjalankan aksi: jawaban berikutnya memakai bahasa baru, diawali konfirmasi
    if (s.status === 'thinking') {
      s.announceLang = true
      return
    }
    s.announceLang = false
    s.cancelSpeech?.()
    s.cancelSpeech = null
    const out = switchTo(s.lang, s.ctx)
    s.ctx = out.ctx
    say(out.reply)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceLang])

  // Tab (context) diganti di tengah call: assistant berhenti, mengonfirmasi,
  // lalu membacakan briefing tab baru dan tawaran pertamanya.
  function rebrief() {
    const s = r.current
    s.retab = false
    s.cancelSpeech?.()
    s.cancelSpeech = null
    const o = openingFor(live.current.tab, s.lang, { done: s.ctx.done, switched: true })
    s.ctx = o.ctx
    say(o.reply)
  }

  const tabKey = JSON.stringify(tab)
  useEffect(() => {
    const s = r.current
    if (!s.active) {
      // Chat tanpa call: pemisah nama tab, lalu briefing tab baru masuk ke percakapan
      if (!s.chatStarted || s.chatTabKey === tabKey) return
      s.lang = live.current.voiceLang
      const t = live.current.tab
      // Briefing tab sebelumnya belum disentuh (belum ada pesan sesudahnya): diganti, bukan ditumpuk
      const prev = s.lastBrief && s.lastBrief.seq === s.msgSeq ? s.lastBrief : null
      s.lastBrief = null
      // Tab asal dan keadaannya sebelum rangkaian pindah tab yang belum disentuh
      let inherit = prev && { fromKey: prev.fromKey, ctxBefore: prev.ctxBefore }
      if (s.briefTimer) {
        // Masih memudar dari pindah tab sebelumnya: selesaikan sekarang, briefing tab itu tidak jadi ditulis
        clearTimeout(s.briefTimer.id)
        s.briefTimer.drop()
        inherit = s.briefTimer.inherit
        s.briefTimer = null
      }
      // Kembali ke tab asal sebelum briefing itu disentuh: cukup hapus briefingnya, percakapan lama sudah di atas
      const back = !!inherit && inherit.fromKey === tabKey
      const fromKey = inherit ? inherit.fromKey : s.chatTabKey
      const ctxBefore = inherit ? inherit.ctxBefore : s.ctx
      s.chatTabKey = tabKey
      let post
      if (back) {
        s.ctx = ctxBefore
        post = () => {
          s.briefTimer = null
          showWaiting()
        }
      } else {
        const o = openingFor(t, s.lang, { done: s.ctx.done, chat: true, pending: ctxBefore.pending })
        s.ctx = o.ctx
        post = () => {
          s.briefTimer = null
          const div = pushMsg('tab', tabName(t), 'chat')
          chatReply(o.reply, false, { parts: o.parts })
          s.lastBrief = { ids: [div, r.current.msgSeq], seq: r.current.msgSeq, fromKey, ctxBefore }
        }
      }
      if (prev) {
        setWaiting(null)
        setMessages((m) => m.map((x) => (prev.ids.includes(x.id) ? { ...x, leaving: true } : x)))
        const drop = () => setMessages((m) => m.filter((x) => !prev.ids.includes(x.id)))
        s.briefTimer = {
          drop,
          inherit: { fromKey, ctxBefore },
          id: setTimeout(() => {
            drop()
            post()
          }, BRIEF_FADE_MS),
        }
        return
      }
      post()
      return
    }
    if (s.tabKey === tabKey) return
    s.tabKey = tabKey
    if (live.current.aiMode === 'listen' || s.ending) return
    if (s.status === 'thinking') {
      s.retab = true
      return
    }
    rebrief()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKey])

  // Timer sesi
  const running = status !== 'idle' && status !== 'ended'
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  // Bersihkan saat komponen dilepas
  useEffect(
    () => () => {
      const s = r.current
      s.active = false
      clearTimeout(s.thinkTimer)
      clearTimeout(s.chatTimer)
      s.cancelSpeech?.()
      s.meter?.close()
      if (s.rec) {
        s.rec.onresult = s.rec.onerror = s.rec.onend = null
        try {
          s.rec.abort()
        } catch {
          /* abaikan */
        }
      }
    },
    []
  )

  // Level suara 0..1 untuk orb (dibaca tiap frame, tanpa re-render)
  const getLevel = useCallback((t) => {
    const s = r.current
    switch (s.status) {
      case 'listening': {
        if (live.current.muted || !s.active) return 0
        const mic = s.meter ? s.meter.read() : 0
        s.bump *= 0.9
        return clamp(Math.max(mic, s.bump) + 0.05, 0, 1)
      }
      case 'speaking': {
        const w = (Math.sin(t * 7.3) + Math.sin(t * 11.9 + 1.3) + Math.sin(t * 4.1 + 0.4)) / 3
        s.pulse *= 0.9
        return clamp(0.38 + 0.3 * w + 0.35 * s.pulse, 0, 1)
      }
      case 'thinking':
        return 0.18 + 0.12 * Math.sin(t * 2.8)
      case 'connecting':
        return 0.15
      default:
        return 0
    }
  }, [])

  // Layar Voice sebelum call: pertanyaan terakhir dari chat, kalau user sudah mengobrol
  let resume = null
  if (r.current.chatTalked) {
    const last = [...messages].reverse().find((m) => m.who === 'ai')
    if (last) {
      const sentences = last.text.match(/[^.!?]+[.!?]+/g) || [last.text]
      resume = (sentences.filter((x) => x.trim().endsWith('?')).pop() || sentences.pop()).trim()
    }
  }

  return {
    status,
    muted,
    seconds,
    caption,
    notes,
    summary,
    supported,
    feed,
    waiting,
    working,
    start,
    end: () => endSession(),
    toggleMute,
    getLevel,
    answer,
    toggleOrder,
    undo: undoFromFeed,
    messages,
    typing,
    openChat,
    send,
    spoken,
    resume,
  }
}
