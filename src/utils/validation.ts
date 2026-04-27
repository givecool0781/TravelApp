// Input validation utilities — applied at all user input boundaries

const LIMITS = {
  tripName: 80,
  destination: 60,
  country: 60,
  eventTitle: 100,
  notes: 500,
  address: 200,
  website: 300,
  phone: 30,
  duration: 40,
  label: 60,
}

function clamp(value: string, max: number): string {
  return value.trim().slice(0, max)
}

// URL must start with http/https only — blocks javascript: and data: URIs
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Phone: digits, spaces, +, -, (, ) only
function isSafePhone(phone: string): boolean {
  return /^[\d\s+\-().]{0,30}$/.test(phone)
}

// Time: HH:MM format
function isValidTime(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time)
}

// Date: YYYY-MM-DD format
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime())
}

export interface TripFormErrors {
  name?: string
  destination?: string
  country?: string
  startDate?: string
  endDate?: string
}

export interface EventFormErrors {
  title?: string
  time?: string
  notes?: string
  website?: string
  phone?: string
}

export function sanitizeTripInput(data: {
  name: string
  destination: string
  country: string
  startDate: string
  endDate: string
  emoji: string
}) {
  return {
    name: clamp(data.name, LIMITS.tripName),
    destination: clamp(data.destination, LIMITS.destination),
    country: clamp(data.country, LIMITS.country),
    startDate: data.startDate,
    endDate: data.endDate,
    emoji: data.emoji || '✈️',
  }
}

export function validateTrip(data: ReturnType<typeof sanitizeTripInput>): TripFormErrors {
  const errors: TripFormErrors = {}
  if (!data.name) errors.name = '請輸入旅行名稱'
  if (!data.destination) errors.destination = '請輸入目的地'
  if (!data.country) errors.country = '請輸入國家'
  if (!isValidDate(data.startDate)) errors.startDate = '請選擇出發日期'
  if (!isValidDate(data.endDate)) errors.endDate = '請選擇回程日期'
  if (data.startDate && data.endDate && data.endDate < data.startDate)
    errors.endDate = '回程日期不能早於出發日期'
  return errors
}

export function sanitizeEventInput(data: {
  title: string
  time: string
  notes: string
  website: string
  phone: string
  duration: string
  address: string
}) {
  return {
    title: clamp(data.title, LIMITS.eventTitle),
    time: data.time,
    notes: clamp(data.notes, LIMITS.notes),
    website: clamp(data.website, LIMITS.website),
    phone: clamp(data.phone, LIMITS.phone),
    duration: clamp(data.duration, LIMITS.duration),
    address: clamp(data.address, LIMITS.address),
  }
}

export function validateEvent(data: ReturnType<typeof sanitizeEventInput>): EventFormErrors {
  const errors: EventFormErrors = {}
  if (!data.title) errors.title = '請輸入行程名稱'
  if (!isValidTime(data.time)) errors.time = '時間格式應為 HH:MM'
  if (data.website && !isSafeUrl(data.website)) errors.website = '請輸入有效的網址（http/https）'
  if (data.phone && !isSafePhone(data.phone)) errors.phone = '電話格式不正確'
  return errors
}
