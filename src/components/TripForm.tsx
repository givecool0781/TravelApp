import { useState } from 'react'
import { X } from 'lucide-react'
import type { Trip, TripDay } from '../types'
import { sanitizeTripInput, validateTrip, type TripFormErrors } from '../utils/validation'

const EMOJIS = ['✈️', '🗼', '🏯', '🗽', '🏰', '🌏', '🏖️', '🏔️', '🎌', '🇯🇵', '🇫🇷', '🇺🇸', '🇬🇧', '🇮🇹', '🇹🇭']

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function dateRange(startDate: string, endDate: string): string[] {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = Date.UTC(sy, sm - 1, sd)
  const end = Date.UTC(ey, em - 1, ed)
  const dates: string[] = []
  for (let ts = start; ts <= end; ts += 86400000) {
    const d = new Date(ts)
    dates.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`)
  }
  return dates
}

function buildDays(startDate: string, endDate: string): TripDay[] {
  return dateRange(startDate, endDate).map((date) => ({
    id: `day-${generateId()}`,
    date,
    events: [],
  }))
}

// When editing: keep existing events for dates that remain, add empty days for new dates
function rebuildDays(existingDays: TripDay[], startDate: string, endDate: string): TripDay[] {
  const existingMap = new Map(existingDays.map((d) => [d.date, d]))
  return dateRange(startDate, endDate).map((date) => {
    const existing = existingMap.get(date)
    return existing ?? { id: `day-${generateId()}`, date, events: [] }
  })
}

interface Props {
  existingTrip?: Trip
  onSave: (trip: Trip) => void
  onClose: () => void
}

export default function TripForm({ existingTrip, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: existingTrip?.name ?? '',
    destination: existingTrip?.destination ?? '',
    country: existingTrip?.country ?? '',
    startDate: existingTrip?.startDate ?? '',
    endDate: existingTrip?.endDate ?? '',
    emoji: existingTrip?.emoji ?? '✈️',
  })
  const [errors, setErrors] = useState<TripFormErrors>({})

  function handleChange(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function handleSubmit() {
    const sanitized = sanitizeTripInput(form)
    const errs = validateTrip(sanitized)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const trip: Trip = existingTrip
      ? {
          ...existingTrip,
          ...sanitized,
          days: rebuildDays(existingTrip.days, sanitized.startDate, sanitized.endDate),
        }
      : {
          id: `trip-${generateId()}`,
          ...sanitized,
          days: buildDays(sanitized.startDate, sanitized.endDate),
        }

    onSave(trip)
    onClose()
  }

  const isEdit = !!existingTrip

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? '編輯旅行' : '新增旅行'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">圖示</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => handleChange('emoji', e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-colors
                    ${form.emoji === e ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-100 hover:bg-slate-200'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Trip name */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">旅行名稱 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例：日本東京之旅"
              maxLength={80}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition
                ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Destination + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">城市 *</label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => handleChange('destination', e.target.value)}
                placeholder="東京"
                maxLength={60}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                  ${errors.destination ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.destination && <p className="text-xs text-red-500 mt-1">{errors.destination}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">國家 *</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="日本"
                maxLength={60}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                  ${errors.country ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">出發日期 *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                  ${errors.startDate ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">回程日期 *</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                  ${errors.endDate ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <p className="text-xs text-slate-400">* 為必填欄位</p>
        </div>

        <div className="px-5 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
            取消
          </button>
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            {isEdit ? '儲存變更' : '建立旅行'}
          </button>
        </div>
      </div>
    </div>
  )
}
