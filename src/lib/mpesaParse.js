import * as pdfjsLib from 'pdfjs-dist'

// Point PDF.js worker at the bundled copy via Vite's asset URL resolution
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

// ── Text extraction ──────────────────────────────────────────────────────────

export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer()
  const doc    = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages  = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page    = await doc.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map(it => it.str).join(' '))
  }
  return pages.join('\n')
}

// ── Transaction parser ───────────────────────────────────────────────────────

const DATE_RE   = /\b(\d{2})\/(\d{2})\/(\d{4})\b/
const AMOUNT_RE = /([-]?[\d,]{1,10}\.\d{2})/g
const TXID_RE   = /\b[A-Z]{2,4}[0-9A-Z]{6,12}\b/g

const SKIP_TYPES = ['receive money', 'received', 'deposit', 'reverse', 'm-shwari deposit', 'fuliza repayment']
const CAT_MAP = [
  { kw: ['food','restaurant','java','chicken','pizza','cafe','nyama','mama','hotel','bar','eat','lunch','dinner','breakfast'], cat: 'food' },
  { kw: ['supermarket','store','mall','shop','market','kiosk','wholesale'], cat: 'shopping' },
  { kw: ['uber','bolt','taxi','matatu','fare','bus','shuttle','parking','fuel','petrol','transport','sgr','train'], cat: 'transport' },
  { kw: ['hotel','lodge','resort','airbnb','accommodation','hostel','bungalow'], cat: 'accommodation' },
  { kw: ['park','game','safari','ticket','entry','museum'], cat: 'activities' },
  { kw: ['beer','wine','spirit','liquor','tusker','quencher','drink'], cat: 'drinks' },
  { kw: ['airtime','data','bundles','safaricom','telkom'], cat: 'other' },
  { kw: ['kplc','water','stima','rent','nairobi water','dstv','showmax','netflix'], cat: 'other' },
]

function guessCategory(desc) {
  const low = desc.toLowerCase()
  for (const { kw, cat } of CAT_MAP) {
    if (kw.some(k => low.includes(k))) return cat
  }
  return 'other'
}

function parseLine(line) {
  const dateMatch = line.match(DATE_RE)
  if (!dateMatch) return null

  const amounts = [...line.matchAll(AMOUNT_RE)]
    .map(m => Number(m[1].replace(/,/g, '')))
  // Only keep outgoing (negative) amounts
  const debit = amounts.find(a => a < 0)
  if (!debit) return null
  const amount = Math.abs(debit)
  if (amount < 10) return null

  const lower = line.toLowerCase()
  if (SKIP_TYPES.some(t => lower.includes(t))) return null

  const [, dd, mm, yyyy] = dateMatch
  const date = `${yyyy}-${mm}-${dd}`

  let desc = line
    .replace(DATE_RE, '')
    .replace(TXID_RE, '')
    .replace(AMOUNT_RE, '')
    .replace(/\bCompleted\b|\bFailed\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/^[-–,;]+/, '')
    .trim()

  if (!desc) desc = 'M-Pesa Transaction'

  return {
    id:          crypto.randomUUID(),
    date,
    description: desc,
    amount,
    category:    guessCategory(desc),
    paymentMethod: 'mpesa',
    paymentSource: 'personal',
    status:      'approved',
    splitBetween: [],
    splitMode:   'equal',
    customSplits: null,
    isPreTrip:   false,
    createdAt:   new Date().toISOString(),
  }
}

export function parseMpesaText(text) {
  const lines  = text.split(/\n/)
  const parsed = []
  const seen   = new Set()

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const tx = parseLine(line)
    if (!tx) continue

    // Deduplicate by date + amount combo
    const key = `${tx.date}-${tx.amount}-${tx.description.slice(0, 20)}`
    if (seen.has(key)) continue
    seen.add(key)
    parsed.push(tx)
  }

  return parsed.sort((a, b) => a.date.localeCompare(b.date))
}

export async function parseMpesaPdf(file) {
  const text = await extractPdfText(file)
  return parseMpesaText(text)
}
