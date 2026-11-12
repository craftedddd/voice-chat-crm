import { useCallback, useEffect, useRef, useState } from 'react'
import { getSR, isVoiceSupported, primeSpeech, speak, createMicMeter } from './speech.js'
import { respond, openingFor } from './brain.js'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/**
 * Mesin status voice chat:
 * idle -> connecting -> listening <-> thinking -> speaking -> listening ... -> ended
 * Semua nilai yang dibaca callback async diambil dari ref agar tidak basi.
 */
export default function useVoiceChat({ tab, aiMode, askFirst, onToast }) {
  const [status, setStatus] = useState('idle')
  const [muted, setMuted] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [caption, setCaption] = useState(null) // { who, lead, tail }
  const [notes, setNotes] = useState(0)
  const [supported] = useState(isVoiceSupported)

  const live = useRef({})
  live.current = { ...live.current, tab, aiMode, askFirst, onToast, muted }

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
  })

  const go = (s) => {
    r.current.status = s
    setStatus(s)
  }
  const toast = (msg) => live.current.onToast?.(msg)

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

  function endSession(finalStatus = 'ended') {
    const s = r.current
    s.active = false
    clearTimeout(s.thinkTimer)
    s.cancelSpeech?.()
    s.cancelSpeech = null
    stopRecognition()
    s.meter?.close()
    s.meter = null
    s.ctx = { pending: null, done: [] }
    go(finalStatus)
  }

  function say(text, thenEnd = false) {
    const s = r.current
    stopRecognition()
    go('speaking')
    setCaption({ who: 'ai', lead: '', tail: text })
    s.cancelSpeech = speak(text, {
      onProgress: (n, boundary) => {
        if (boundary) s.pulse = 1
        setCaption({ who: 'ai', lead: text.slice(0, n), tail: text.slice(n) })
      },
      onEnd: () => {
        s.cancelSpeech = null
        if (!s.active) return
        if (thenEnd) {
          endSession()
          return
        }
        go('listening')
        beginListening()
      },
    })
  }

  function handleFinal(text) {
    const s = r.current
    stopRecognition()

    // Listen only: AI diam dan hanya mencatat
    if (live.current.aiMode === 'listen') {
      setNotes((n) => n + 1)
      setCaption({ who: 'note', lead: text, tail: '' })
      setTimeout(beginListening, 250)
      return
    }

    go('thinking')
    setCaption({ who: 'user', lead: text, tail: '' })
    s.thinkTimer = setTimeout(() => {
      if (!s.active) return
      const out = respond({
        text,
        mode: live.current.aiMode,
        askFirst: live.current.askFirst,
        tab: live.current.tab,
        ctx: s.ctx,
      })
      s.ctx = out.ctx
      if (out.toast) toast(out.toast)
      say(out.reply, !!out.endCall)
    }, 450 + Math.random() * 350)
  }

  function beginListening() {
    const s = r.current
    if (!s.active || live.current.muted) return
    if (s.status === 'speaking' || s.status === 'thinking') return
    stopRecognition()

    const rec = new (getSR())()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.maxAlternatives = 1
    s.rec = rec

    rec.onresult = (e) => {
      if (s.rec !== rec) return
      s.bump = 0.55
      const text = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(' ')
        .trim()
      if (!text) return
      setCaption({ who: 'user', lead: text, tail: '' })
      if (e.results[e.results.length - 1].isFinal) handleFinal(text)
    }

    rec.onerror = (e) => {
      if (s.rec !== rec) return
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        toast('Microphone access is blocked. Allow it in your browser settings, then try again.')
        endSession('idle')
      } else if (e.error === 'network') {
        toast('The browser speech service is unreachable. Check your connection.')
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
        toast('Voice recognition keeps stopping. Tap the mic to try again.')
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
      toast("Voice chat isn't supported in this browser. Try Chrome, Edge, or Safari.")
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
          ? 'No microphone was found on this device.'
          : 'Microphone access is blocked. Allow it in your browser settings, then try again.'
      )
      go('idle')
      return
    }

    s.active = true
    s.ctx = { pending: null, done: [] }
    s.restarts = []
    if (live.current.aiMode === 'listen') {
      go('listening')
      beginListening()
    } else {
      const opening = openingFor(live.current.tab)
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

  return {
    status,
    muted,
    seconds,
    caption,
    notes,
    supported,
    start,
    end: () => endSession(),
    toggleMute,
    getLevel,
  }
}
