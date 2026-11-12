// "Otak" demo: percakapan proaktif berbasis aturan dengan data CRM contoh.
// Assistant memberi rekomendasi, menawarkan bantuan, menunggu izin user,
// lalu menindaklanjuti dengan langkah berikutnya. Tidak memanggil AI eksternal.

// Briefing pembuka per tab. lead = bagian gelap, tail = bagian abu (gaya desain).
export const BRIEFINGS = {
  Everything: {
    lead: 'You have three deals waiting on a reply. The biggest is Acme Co., worth $12,000',
    tail: ', with no reply for nine days....',
  },
  Deals: {
    lead: 'Pipeline looks healthy this week. Four deals moved into negotiation',
    tail: ', and Northwind is ready for a proposal....',
  },
  Contacts: {
    lead: 'You added six new contacts from the webinar. Two of them opened your follow-up',
    tail: ' email earlier this morning....',
  },
  Tasks: {
    lead: 'Eight tasks are due today. Three are quick calls you could finish',
    tail: ' before your lunch break....',
  },
}

export function briefingText(tab) {
  const b = BRIEFINGS[tab] || BRIEFINGS.Everything
  return (b.lead + b.tail).replace(/\.{2,}$/, '.')
}

const rnd = (list) => list[Math.floor(Math.random() * list.length)]

// ---------------------------------------------------------------------------
// Langkah percakapan. Tiap langkah punya pertanyaan (ask) dan hasil jika user
// menjawab ya/tidak (atau memilih salah satu opsi).
// Hasil: { reply, toast?, next?: idLangkah, mark?: kunciSelesai }
// ---------------------------------------------------------------------------
const STEPS = {
  offer_followup_acme: {
    ask: [
      'Want me to draft a short check-in email to Acme Co.?',
      'Shall I draft a quick check-in for Acme Co. for you?',
    ],
    yes: {
      reply: 'Done. I drafted a short check-in that mentions the proposal and asks one clear question.',
      toast: 'Acme Co. check-in drafted',
      next: 'ask_send_acme',
    },
    no: { reply: 'No problem.', next: 'offer_remind_acme' },
  },
  ask_send_acme: {
    ask: ['Should I send it now, or keep it in your drafts?'],
    retry: 'Sorry, should I send it now, or keep it in your drafts?',
    choices: [
      {
        words: ['send', 'now', 'yes', 'yeah', 'sure', 'go ahead', 'ok', 'okay'],
        out: {
          reply: "Sent. I'll keep an eye out for their reply.",
          toast: 'Email sent to Acme Co.',
          next: 'offer_remind_acme_later',
        },
      },
      {
        words: ['keep', 'draft', 'drafts', 'later', 'save', 'no', 'nope', 'wait', 'hold'],
        out: { reply: "Okay, it's saved in your drafts for whenever you're ready.", mark: 'acme' },
      },
    ],
  },
  offer_remind_acme: {
    ask: ['Want me to remind you about Acme Co. tomorrow morning instead?'],
    yes: { reply: "Done. I set a reminder for tomorrow at 9.", toast: 'Reminder set for 9:00 tomorrow', mark: 'acme' },
    no: { reply: "Understood. I'll leave Acme Co. for now.", mark: 'acme' },
  },
  offer_remind_acme_later: {
    ask: ["Want me to set a reminder in two days in case they don't reply?"],
    yes: { reply: 'Done. The reminder is set for two days from now.', toast: 'Reminder set in 2 days', mark: 'acme' },
    no: { reply: 'Okay, no reminder.', mark: 'acme' },
  },
  offer_call_globex: {
    ask: [
      'Want me to book a 15 minute call with Globex on your calendar for tomorrow at 10?',
      'Shall I put a quick call with Globex on your calendar for tomorrow at 10?',
    ],
    yes: { reply: "Booked. It's on your calendar for tomorrow at 10.", toast: 'Globex call booked for tomorrow', mark: 'globex' },
    no: { reply: "Alright, I'll skip Globex for now.", mark: 'globex' },
  },
  offer_proposal_northwind: {
    ask: [
      'Want me to prepare a proposal draft for Northwind from your standard template?',
      'Shall I start a Northwind proposal from your usual template?',
    ],
    yes: {
      reply: "Done. The draft is ready with your standard pricing. I'd review the totals before sending it.",
      toast: 'Northwind proposal drafted',
      mark: 'northwind',
    },
    no: { reply: 'Okay, no rush on Northwind.', mark: 'northwind' },
  },
  offer_outreach_webinar: {
    ask: [
      'Want me to draft a personal note to the two contacts who opened your email?',
      'Shall I write a short personal note to the two who opened your email?',
    ],
    yes: {
      reply: 'Done. Both notes mention the webinar topic they engaged with, so they should feel personal.',
      toast: '2 outreach drafts saved',
      mark: 'webinar',
    },
    no: { reply: "Okay, I'll leave the webinar contacts for now.", mark: 'webinar' },
  },
  offer_plan_tasks: {
    ask: [
      'Want me to block 30 minutes this morning on your calendar for the three quick calls?',
      'Shall I block some time this morning for those three quick calls?',
    ],
    yes: { reply: 'Blocked. I scheduled 30 minutes at 11 for your quick calls.', toast: '30 min blocked at 11:00', mark: 'tasks' },
    no: { reply: "No problem, I'll leave your calendar as it is.", mark: 'tasks' },
  },
  offer_suggest: {
    ask: ['Want me to suggest where to start?'],
    yes: { reply: 'Sure.', next: 'SUGGEST' },
    no: { reply: "No problem. I'm here whenever you need me." },
  },
}

// Antrean rekomendasi: yang belum selesai ditawarkan berikutnya.
const QUEUE = [
  { key: 'acme', step: 'offer_followup_acme', lead: 'Acme Co. is still waiting on you.' },
  { key: 'globex', step: 'offer_call_globex', lead: 'Globex has been quiet for four days too.' },
  { key: 'northwind', step: 'offer_proposal_northwind', lead: 'Northwind is ready for a proposal.' },
  { key: 'webinar', step: 'offer_outreach_webinar', lead: 'Two webinar contacts opened your email.' },
  { key: 'tasks', step: 'offer_plan_tasks', lead: 'You still have three quick calls due today.' },
]

const askOf = (id) => rnd(STEPS[id].ask)

function nextSuggestion(done) {
  const item = QUEUE.find((q) => !done.includes(q.key))
  if (!item) return null
  return { step: item.step, line: `${item.lead} ${askOf(item.step)}` }
}

const ALL_DONE = "That covers your urgent items. Anything else you'd like to look at?"

// Menyusun jawaban akhir + menentukan langkah berikutnya.
function conclude(out, ctx) {
  const done = out.mark && !ctx.done.includes(out.mark) ? [...ctx.done, out.mark] : ctx.done
  let reply = out.reply
  let pending = null

  if (out.next === 'SUGGEST') {
    const s = nextSuggestion(done)
    reply = s ? `${reply} ${s.line}` : `${reply} ${ALL_DONE}`
    pending = s ? s.step : null
  } else if (out.next) {
    reply = `${reply} ${askOf(out.next)}`
    pending = out.next
  } else {
    const s = nextSuggestion(done)
    if (s) {
      reply = `${reply} ${rnd(['Next up:', 'One more thing:', 'While we are at it:'])} ${s.line}`
      pending = s.step
    } else {
      reply = `${reply} ${ALL_DONE}`
    }
  }
  return { reply, toast: out.toast, ctx: { pending, done } }
}

// User meminta aksi langsung. Ask Me First menentukan perlu konfirmasi atau tidak.
function requestAction(stepId, askFirst, ctx) {
  if (askFirst) {
    return {
      reply: `${rnd(['Sure.', 'Happy to.'])} ${askOf(stepId)}`,
      ctx: { ...ctx, pending: stepId },
    }
  }
  const out = conclude(STEPS[stepId].yes, ctx)
  return { ...out, reply: `${rnd(['On it.', 'Sure thing.'])} ${out.reply.replace(/^Done\.\s*/, '')}` }
}

// ---------------------------------------------------------------------------
// Topik informasi: tiap mode punya gaya sendiri, semuanya ditutup tawaran bantuan.
// ---------------------------------------------------------------------------
const TOPICS = {
  waiting: {
    step: 'offer_followup_acme',
    brief: 'Three deals are waiting on a reply. Acme Co. is the oldest at nine days, so I would start there.',
    think:
      'Three deals are waiting: Acme Co. at $12,000, quiet for nine days, then Globex and Initech, both more recent. Acme carries the most money and the most risk, so nudging it first protects the most revenue, while the smaller two can safely wait a day.',
    guide:
      'Here is how I would catch up. First, start with Acme Co., the oldest. Second, send a short check-in. Third, set a reminder in case they stay quiet. I can handle the first two for you.',
  },
  acme: {
    step: 'offer_followup_acme',
    brief: 'Acme Co. is worth $12,000 and has been silent for nine days since the proposal. A short check-in usually gets things moving.',
    think:
      'Acme Co. is $12,000 and quiet for nine days after the proposal. That often means it is stuck with another decision maker. A light check-in is low risk, while a call is warmer but heavier. I would lean toward the email first.',
    guide:
      'Here is how to unstick Acme Co. First, check the last email you sent. Second, send a short check-in that asks one clear question. Third, set a reminder for two days later.',
  },
  pipeline: {
    step: 'offer_proposal_northwind',
    brief: 'Four deals moved into negotiation this week, and Northwind is ready for a proposal. Sending it soon keeps the momentum.',
    think:
      'Four deals are in negotiation, and Northwind is ready for a proposal. Sending quickly keeps momentum, though a day of tailoring could raise your odds. I would lean toward a draft today so you can still review it.',
    guide:
      'Here is how to move Northwind forward. First, generate a proposal from your template. Second, review the pricing. Third, send it. I can do the first step right now.',
  },
  contacts: {
    step: 'offer_outreach_webinar',
    brief: 'You added six contacts from the webinar, and two already opened your email. They are the warmest, so I would reach out to them first.',
    think:
      'Six contacts came from the webinar and two already opened your email. A personal note to those two should convert better than a broad message to all six, so I would start with them.',
    guide:
      'Here is how to work the webinar leads. First, start with the two who opened your email. Second, write a personal note that mentions the webinar. Third, follow up in two days. I can draft the notes.',
  },
  tasks: {
    step: 'offer_plan_tasks',
    brief: 'Eight tasks are due today, and three are quick calls. I would knock those out first to clear your plate.',
    think:
      'Eight tasks are due today. Clearing the three quick calls first builds momentum, while the five larger ones may deserve your sharpest hours. I would do the calls first thing.',
    guide:
      'Here is a simple plan. First, sort by due date. Second, finish the three quick calls. Third, block time for the five larger ones. I can block the call time for you.',
  },
}

function topicReply(key, mode, ctx) {
  const t = TOPICS[key]
  const body = t[mode] || t.brief
  return { reply: `${body} ${askOf(t.step)}`, ctx: { ...ctx, pending: t.step } }
}

// ---------------------------------------------------------------------------
// Utilitas pencocokan
// ---------------------------------------------------------------------------
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$' ]/g, ' ').replace(/\s+/g, ' ').trim()
const any = (t, list) => list.some((w) => new RegExp(`\\b${w}\\b`).test(t))
const YES = /^(yes|yeah|yep|yup|sure|ok|okay|go ahead|do it|please|please do|sounds good|that works|let's do it|lets do it|absolutely|of course|why not)\b/
const NO = /^(no|nope|nah|not now|not yet|don't|do not|never mind|maybe later|skip|leave it)\b/

export function openingFor(tab) {
  const stepByTab = {
    Everything: 'offer_followup_acme',
    Deals: 'offer_proposal_northwind',
    Contacts: 'offer_outreach_webinar',
    Tasks: 'offer_plan_tasks',
  }
  const step = stepByTab[tab] || 'offer_followup_acme'
  return {
    reply: `${briefingText(tab)} ${askOf(step)}`,
    ctx: { pending: step, done: [] },
  }
}

/**
 * respond({ text, mode, askFirst, tab, ctx })
 * -> { reply, ctx, toast?, endCall? }
 */
export function respond({ text, mode, askFirst, tab, ctx: prev }) {
  const t = norm(text)
  const ctx = prev || { pending: null, done: [] }

  // 0) Batalkan aksi terakhir ("undo that"); eksekusinya ada di useVoiceChat
  if (/\b(undo|take (that|it) back|revert that|cancel that)\b/.test(t)) {
    return { undo: true, reply: '', ctx: { ...ctx, pending: null } }
  }

  // 1) Jawaban untuk tawaran / pertanyaan sebelumnya
  if (ctx.pending && STEPS[ctx.pending]) {
    const step = STEPS[ctx.pending]
    if (step.choices) {
      const c = step.choices.find((x) => any(t, x.words))
      if (c) return conclude(c.out, ctx)
    } else if (YES.test(t)) {
      return conclude(step.yes, ctx)
    } else if (NO.test(t)) {
      return conclude(step.no, ctx)
    }
  }

  // 2) Percakapan umum
  if (any(t, ['goodbye', 'bye', 'hang up', "that's all", 'end call', 'end the call'])) {
    return { reply: 'Okay, talk to you soon.', endCall: true, ctx: { ...ctx, pending: null } }
  }
  if (any(t, ['thanks', 'thank you', 'cheers'])) {
    const s = nextSuggestion(ctx.done)
    return {
      reply: s ? `Anytime. ${s.line}` : "Anytime. I'm here if you need anything else.",
      ctx: { ...ctx, pending: s ? s.step : null },
    }
  }
  if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(t)) {
    return { reply: `Hi! ${askOf('offer_suggest')}`, ctx: { ...ctx, pending: 'offer_suggest' } }
  }
  if (t.includes('what can you do') || any(t, ['help', 'help me'])) {
    return {
      reply: `I can summarize your deals, contacts, and tasks, recommend what to do next, and take care of follow-ups once you say yes. ${askOf('offer_suggest')}`,
      ctx: { ...ctx, pending: 'offer_suggest' },
    }
  }

  // 3) Minta rekomendasi
  if (
    /what should i (do|start|focus)|recommend|suggest|prioriti[sz]e|where (do i|should i) start|what'?s next|what else|anything else|tell me more|\bnext\b/.test(t)
  ) {
    return conclude({ reply: rnd(['Here is what I would do.', 'My suggestion:']), next: 'SUGGEST' }, ctx)
  }

  // 4) User meminta aksi langsung
  if (any(t, ['proposal']) && any(t, ['send', 'prepare', 'draft', 'create', 'write', 'start'])) {
    return requestAction('offer_proposal_northwind', askFirst, ctx)
  }
  if (any(t, ['note', 'notes', 'outreach', 'reach out']) && any(t, ['contact', 'contacts', 'webinar', 'write', 'draft', 'send'])) {
    return requestAction('offer_outreach_webinar', askFirst, ctx)
  }
  if (any(t, ['schedule', 'book', 'set up']) && any(t, ['call', 'meeting', 'globex'])) {
    return requestAction('offer_call_globex', askFirst, ctx)
  }
  if (any(t, ['block', 'calendar']) && any(t, ['calls', 'time', 'tasks'])) {
    return requestAction('offer_plan_tasks', askFirst, ctx)
  }
  if (any(t, ['remind', 'reminder', 'add a task', 'create a task', 'new task'])) {
    return requestAction('offer_remind_acme', askFirst, ctx)
  }
  if (any(t, ['send', 'draft', 'email', 'follow up', 'follow-up', 'followup', 'check in', 'check-in'])) {
    return requestAction('offer_followup_acme', askFirst, ctx)
  }

  // 5) Informasi + rekomendasi
  if (any(t, ['acme', 'biggest', 'largest', 'top deal'])) return topicReply('acme', mode, ctx)
  if (any(t, ['waiting', 'reply', 'replies', 'responded', 'unanswered', 'quiet'])) return topicReply('waiting', mode, ctx)
  if (any(t, ['pipeline', 'negotiation', 'northwind', 'deals', 'deal'])) return topicReply('pipeline', mode, ctx)
  if (any(t, ['contact', 'contacts', 'webinar', 'leads', 'lead'])) return topicReply('contacts', mode, ctx)
  if (any(t, ['task', 'tasks', 'due', 'to do', 'todo', 'calls', 'today'])) return topicReply('tasks', mode, ctx)
  if (any(t, ['summary', 'brief me', 'overview', 'catch me up', "what's up", 'whats up', 'update'])) {
    const o = openingFor(tab)
    return { reply: o.reply, ctx: { ...ctx, pending: o.ctx.pending } }
  }

  // 6) Ya/tidak tanpa konteks
  if (YES.test(t)) {
    return { reply: `Happy to help. ${askOf('offer_suggest')}`, ctx: { ...ctx, pending: 'offer_suggest' } }
  }

  return {
    reply: `I'm a demo assistant, so I stick to deals, contacts, and tasks. ${askOf('offer_suggest')}`,
    ctx: { ...ctx, pending: 'offer_suggest' },
  }
}

// ---------------------------------------------------------------------------
// Ringkasan sesi: topik yang disebut dan rekomendasi berikutnya
// ---------------------------------------------------------------------------
const ENTITIES = [
  { label: 'Acme Co.', re: /\bacme\b/i },
  { label: 'Globex', re: /\bglobex\b/i },
  { label: 'Initech', re: /\binitech\b/i },
  { label: 'Northwind', re: /\bnorthwind\b/i },
  { label: 'Webinar contacts', re: /\bwebinar\b/i },
  { label: "Today's tasks", re: /\b(tasks?|quick calls)\b/i },
]

/** Daftar topik (entitas CRM) yang muncul di teks percakapan. */
export function topicsIn(text) {
  return ENTITIES.filter((e) => e.re.test(text)).map((e) => e.label)
}

/** Rekomendasi pertama yang belum ditangani di sesi ini. */
export function nextUp(done = []) {
  const item = QUEUE.find((q) => !done.includes(q.key))
  return item ? item.lead : null
}
