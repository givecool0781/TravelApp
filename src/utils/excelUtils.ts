import * as XLSX from 'xlsx'
import type { Trip, TripEvent, TripDay, EventCategory } from '../types'
import { sanitizeEventInput, validateEvent } from './validation'

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']
const MAX_ROWS = 500

const CATEGORY_MAP: Record<string, EventCategory> = {
  餐廳: 'food', food: 'food',
  景點: 'attraction', attraction: 'attraction',
  交通: 'transport', transport: 'transport',
  住宿: 'hotel', hotel: 'hotel',
  其他: 'other', other: 'other',
}

// Canonical header names → internal keys
const HEADER_ALIASES: Record<string, string> = {
  日期: 'date', date: 'date',
  時間: 'time', time: 'time',
  名稱: 'title', 行程名稱: 'title', title: 'title', name: 'title',
  類別: 'category', category: 'category',
  地點: 'address', 地址: 'address', address: 'address', location: 'address',
  備註: 'notes', notes: 'notes',
  時長: 'duration', 預計時長: 'duration', duration: 'duration',
  官網: 'website', 網站: 'website', website: 'website',
  電話: 'phone', phone: 'phone',
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ParsedRow {
  date: string
  event: TripEvent
}

export interface ImportError {
  row: number
  message: string
}

export interface ParseResult {
  rows: ParsedRow[]
  errors: ImportError[]
}

// ── Validation ─────────────────────────────────────────────────────────────

export function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return '只支援 .xlsx 或 .xls 檔案'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `檔案大小不能超過 5MB（目前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`
  }
  return null
}

// ── Parsing ────────────────────────────────────────────────────────────────

function normalizeHeader(raw: string): string {
  const trimmed = raw.toString().trim()
  return HEADER_ALIASES[trimmed] ?? trimmed.toLowerCase()
}

function cellToString(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

// Excel stores times as fractions of a day (e.g. 0.375 = 09:00)
function excelTimeToHHMM(val: unknown): string {
  if (typeof val === 'string') {
    const match = val.match(/^(\d{1,2}):(\d{2})/)
    if (match) return `${match[1].padStart(2, '0')}:${match[2]}`
  }
  if (typeof val === 'number' && val >= 0 && val < 1) {
    const totalMinutes = Math.round(val * 24 * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  return cellToString(val)
}

// Excel stores dates as serial numbers; XLSX.SSF.format can handle this
function excelDateToISO(val: unknown): string {
  if (typeof val === 'string') {
    // Already string like "2025-06-10" or "2025/06/10"
    const normalized = val.replace(/\//g, '-').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized
  }
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val)
    if (date) {
      const y = date.y
      const m = String(date.m).padStart(2, '0')
      const d = String(date.d).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }
  return cellToString(val)
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const fileError = validateFile(file)
  if (fileError) return { rows: [], errors: [{ row: 0, message: fileError }] }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })

  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const raw = (XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  }) as unknown) as unknown[][]

  if (raw.length < 2) {
    return { rows: [], errors: [{ row: 0, message: '檔案內容為空或缺少標題列' }] }
  }

  // Build header map
  const headerRow = raw[0] as unknown[]
  const colMap: Record<string, number> = {}
  headerRow.forEach((cell, idx) => {
    const key = normalizeHeader(String(cell))
    if (key) colMap[key] = idx
  })

  if (!('date' in colMap) || !('time' in colMap) || !('title' in colMap)) {
    return {
      rows: [],
      errors: [{ row: 1, message: '找不到必要欄位「日期」、「時間」、「名稱」，請使用下載的模板' }],
    }
  }

  const dataRows = raw.slice(1)
  if (dataRows.length > MAX_ROWS) {
    return {
      rows: [],
      errors: [{ row: 0, message: `一次最多匯入 ${MAX_ROWS} 筆，目前有 ${dataRows.length} 筆` }],
    }
  }

  const rows: ParsedRow[] = []
  const errors: ImportError[] = []

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2 // 1-based, skip header

    const get = (key: string) => {
      const colIdx = colMap[key]
      return colIdx !== undefined ? row[colIdx] : ''
    }

    const dateRaw = excelDateToISO(get('date'))
    const timeRaw = excelTimeToHHMM(get('time'))

    const raw = sanitizeEventInput({
      title: cellToString(get('title')),
      time: timeRaw,
      notes: cellToString(get('notes')),
      website: cellToString(get('website')),
      phone: cellToString(get('phone')),
      duration: cellToString(get('duration')),
      address: cellToString(get('address')),
    })

    if (!raw.title) {
      // Skip completely empty rows silently
      if (!dateRaw && !timeRaw) return
      errors.push({ row: rowNum, message: '名稱為空，略過此列' })
      return
    }

    const validationErrors = validateEvent(raw)
    if (Object.keys(validationErrors).length > 0) {
      errors.push({
        row: rowNum,
        message: Object.values(validationErrors).join('、'),
      })
      return
    }

    const categoryRaw = cellToString(get('category')).toLowerCase()
    const category: EventCategory = CATEGORY_MAP[cellToString(get('category'))] ??
      CATEGORY_MAP[categoryRaw] ?? 'other'

    const event: TripEvent = {
      id: `ev-${generateId()}`,
      title: raw.title,
      time: raw.time,
      category,
      notes: raw.notes || undefined,
      website: raw.website || undefined,
      phone: raw.phone || undefined,
      duration: raw.duration || undefined,
      location: raw.address ? { lat: 0, lng: 0, address: raw.address } : undefined,
    }

    rows.push({ date: dateRaw, event })
  })

  return { rows, errors }
}

// ── Template generation ────────────────────────────────────────────────────

export function downloadTemplate(trip: Trip) {
  const headers = ['日期', '時間', '名稱', '類別', '地點', '備註', '時長', '官網', '電話']

  const exampleRows = trip.days.flatMap((day: TripDay) =>
    day.events.length > 0
      ? day.events.map((e: TripEvent) => [
          day.date,
          e.time,
          e.title,
          { food: '餐廳', attraction: '景點', transport: '交通', hotel: '住宿', other: '其他' }[e.category],
          e.location?.address ?? '',
          e.notes ?? '',
          e.duration ?? '',
          e.website ?? '',
          e.phone ?? '',
        ])
      : [[day.date, '09:00', '', '景點', '', '', '', '', '']]
  )

  const data = [headers, ...exampleRows]
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Column widths
  ws['!cols'] = [
    { wch: 14 }, // 日期
    { wch: 8 },  // 時間
    { wch: 28 }, // 名稱
    { wch: 8 },  // 類別
    { wch: 36 }, // 地點
    { wch: 40 }, // 備註
    { wch: 12 }, // 時長
    { wch: 30 }, // 官網
    { wch: 18 }, // 電話
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '行程')

  // Instruction sheet
  const instrData = [
    ['欄位說明'],
    ['日期', '格式：YYYY-MM-DD，例：2025-06-10'],
    ['時間', '格式：HH:MM（24小時制），例：09:00'],
    ['名稱', '行程名稱（必填）'],
    ['類別', '餐廳 / 景點 / 交通 / 住宿 / 其他'],
    ['地點', '地址或地點名稱'],
    ['備註', '最多 500 字'],
    ['時長', '例：1.5 小時'],
    ['官網', '需以 http:// 或 https:// 開頭'],
    ['電話', '例：+81-3-1234-5678'],
    [],
    ['注意事項'],
    ['・日期必須在旅行日期範圍內'],
    ['・名稱為必填，其他欄位可留空'],
    [`・一次最多匯入 ${MAX_ROWS} 筆`],
    ['・檔案大小上限 5MB'],
  ]
  const instrWs = XLSX.utils.aoa_to_sheet(instrData)
  instrWs['!cols'] = [{ wch: 12 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, instrWs, '說明')

  XLSX.writeFile(wb, `${trip.name}_行程模板.xlsx`)
}

// ── Distribute parsed rows into trip days ──────────────────────────────────

export function distributeRowsToTrip(
  trip: Trip,
  rows: ParsedRow[]
): { dayId: string; event: TripEvent }[] {
  const dayMap = new Map(trip.days.map((d: TripDay) => [d.date, d.id]))
  const result: { dayId: string; event: TripEvent }[] = []

  for (const { date, event } of rows) {
    const dayId = dayMap.get(date)
    if (dayId) {
      result.push({ dayId, event })
    }
  }

  return result
}
