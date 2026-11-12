// Pembungkus Web Speech API (pengenalan suara + suara balasan) dan meter mic.

export const getSR = () =>
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export const isVoiceSupported = () =>
  typeof window !== 'undefined' && !!getSR() && 'speechSynthesis' in window

// iOS Safari hanya mengizinkan suara jika "dibangunkan" dari gestur user.
export function primeSpeech() {
  try {
    const u = new SpeechSynthesisUtterance('')
    u.volume = 0
    window.speechSynthesis.speak(u)
  } catch {
    /* abaikan */
  }
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices()
  const en = voices.filter((v) => /^en[-_]/i.test(v.lang))
  const prefer = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Karen', 'Daniel']
  for (const name of prefer) {
    const v = en.find((x) => x.name.includes(name))
    if (v) return v
  }
  return en.find((v) => /en[-_]US/i.test(v.lang)) || en[0] || null
}

const CHARS_PER_SECOND = 15

function wordEnd(text, idx) {
  const m = /[\s,.!?]/.exec(text.slice(idx))
  return m ? idx + m.index : text.length
}

// Potong teks jadi beberapa bagian (di batas kalimat). Chrome sering berhenti
// diam-diam pada ucapan panjang, jadi tiap bagian diucapkan terpisah.
function toChunks(text) {
  const chunks = []
  const re = /[^.!?]+(?:[.!?]+|$)\s*/g
  let cur = null
  let m
  while ((m = re.exec(text))) {
    if (!m[0].trim()) continue
    if (!cur) cur = { text: m[0], offset: m.index }
    else cur.text += m[0]
    if (cur.text.length >= 110) {
      chunks.push(cur)
      cur = null
    }
  }
  if (cur) chunks.push(cur)
  return chunks.length ? chunks : [{ text, offset: 0 }]
}

/**
 * Ucapkan teks. onProgress(charsSpoken, isBoundary) dipanggil saat kata berjalan.
 * Jika browser tidak memberi event kata, progres diperkirakan dari waktu.
 * Jika suara tidak mau mulai atau macet, ucapan disimulasikan agar alur tidak berhenti.
 * Mengembalikan fungsi cancel.
 */
export function speak(text, { onProgress, onEnd }) {
  const synth = window.speechSynthesis
  const chunks = toChunks(text)
  let done = false
  let gotBoundary = false
  let ticker = null
  let guard = null
  let speakTimer = null

  const clearAll = () => {
    clearInterval(ticker)
    clearTimeout(guard)
    clearTimeout(speakTimer)
  }

  const finish = () => {
    if (done) return
    done = true
    clearAll()
    onProgress(text.length, false)
    onEnd()
  }

  // Progres perkiraan berbasis waktu (cadangan jika tidak ada event kata)
  const estimateFrom = (t0, fromChar) => {
    clearInterval(ticker)
    ticker = setInterval(() => {
      if (done || gotBoundary) return
      const n = fromChar + Math.floor(((performance.now() - t0) / 1000) * CHARS_PER_SECOND)
      if (n >= text.length) finish()
      else onProgress(n, false)
    }, 120)
  }

  const playChunk = (i) => {
    if (done) return
    if (i >= chunks.length) return finish()
    const { text: part, offset } = chunks[i]
    let started = false
    let advanced = false
    const next = () => {
      if (advanced || done) return
      advanced = true
      clearTimeout(guard)
      playChunk(i + 1)
    }

    const u = new SpeechSynthesisUtterance(part)
    u.lang = 'en-US'
    u.rate = 1
    u.pitch = 1
    const voice = pickVoice()
    if (voice) u.voice = voice

    u.onstart = () => {
      started = true
      clearTimeout(guard)
      // Jika macet di tengah bagian, lanjut ke bagian berikutnya
      guard = setTimeout(() => {
        if (done) return
        synth.cancel()
        next()
      }, part.length * 120 + 4000)
      if (!gotBoundary) estimateFrom(performance.now(), offset)
    }
    u.onboundary = (e) => {
      gotBoundary = true
      onProgress(offset + wordEnd(part, e.charIndex), true)
    }
    u.onend = next
    u.onerror = next

    synth.cancel()
    // Jeda singkat: di Chrome, speak() tepat setelah cancel() kadang diabaikan.
    speakTimer = setTimeout(() => {
      if (done) return
      synth.speak(u)
      // Suara tidak mau mulai sama sekali: simulasikan sisa ucapan
      guard = setTimeout(() => {
        if (done || started) return
        synth.cancel()
        advanced = true
        estimateFrom(performance.now(), offset)
      }, 2500)
    }, 60)
  }

  playChunk(0)

  return () => {
    if (done) return
    done = true
    clearAll()
    synth.cancel()
  }
}

/** Meter volume mic (0..1) dari MediaStream. */
export function createMicMeter(ctx, stream) {
  const src = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 512
  analyser.smoothingTimeConstant = 0.6
  src.connect(analyser)
  const buf = new Uint8Array(analyser.fftSize)
  return {
    read() {
      analyser.getByteTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) {
        const x = (buf[i] - 128) / 128
        sum += x * x
      }
      return Math.min(1, Math.sqrt(sum / buf.length) * 5)
    },
    close() {
      try {
        src.disconnect()
      } catch {
        /* abaikan */
      }
      stream.getTracks().forEach((t) => t.stop())
      ctx.close().catch(() => {})
    },
  }
}
