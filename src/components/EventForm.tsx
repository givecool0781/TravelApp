import { useState, useRef } from 'react'
import DurationSelect from './DurationSelect'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { X, MapPin, Utensils, Camera, Bus, Hotel, MoreHorizontal } from 'lucide-react'
import type { TripEvent, EventCategory, Location } from '../types'
import { sanitizeEventInput, validateEvent, type EventFormErrors } from '../utils/validation'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string
const LIBRARIES: ('places')[] = ['places']

const CATEGORIES: { value: EventCategory; label: string; icon: React.ElementType }[] = [
  { value: 'food', label: '餐廳', icon: Utensils },
  { value: 'attraction', label: '景點', icon: Camera },
  { value: 'transport', label: '交通', icon: Bus },
  { value: 'hotel', label: '住宿', icon: Hotel },
  { value: 'other', label: '其他', icon: MoreHorizontal },
]

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface Props {
  existingEvent?: TripEvent
  onSave: (event: TripEvent) => void
  onClose: () => void
}

export default function EventForm({ existingEvent, onSave, onClose }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  })

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const [form, setForm] = useState({
    title: existingEvent?.title ?? '',
    time: existingEvent?.time ?? '09:00',
    category: existingEvent?.category ?? 'attraction' as EventCategory,
    notes: existingEvent?.notes ?? '',
    website: existingEvent?.website ?? '',
    phone: existingEvent?.phone ?? '',
    duration: existingEvent?.duration ?? '',
    address: existingEvent?.location?.address ?? '',
  })
  const [location, setLocation] = useState<Location | undefined>(existingEvent?.location)
  const [errors, setErrors] = useState<EventFormErrors>({})

  function handleChange(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function onPlaceChanged() {
    if (!autocompleteRef.current) return
    const place = autocompleteRef.current.getPlace()
    if (!place.geometry?.location) return

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    const address = place.formatted_address ?? place.name ?? ''

    setLocation({ lat, lng, address, placeId: place.place_id })
    setForm((f) => ({ ...f, address }))

    // Auto-fill title if empty
    if (!form.title && place.name) {
      setForm((f) => ({ ...f, title: place.name!.slice(0, 100), address }))
    }
  }

  function handleSubmit() {
    const sanitized = sanitizeEventInput(form)
    const errs = validateEvent(sanitized)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const event: TripEvent = {
      id: existingEvent?.id ?? `ev-${generateId()}`,
      title: sanitized.title,
      time: sanitized.time,
      category: form.category,
      notes: sanitized.notes || undefined,
      website: sanitized.website || undefined,
      phone: sanitized.phone || undefined,
      duration: sanitized.duration || undefined,
      location: location
        ? { ...location, address: sanitized.address || location.address }
        : sanitized.address
        ? { lat: 0, lng: 0, address: sanitized.address }
        : undefined,
    }

    onSave(event)
    onClose()
  }

  const isEdit = !!existingEvent

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[94vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? '編輯行程' : '新增行程'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Category */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">類別</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange('category', value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors
                    ${form.category === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">行程名稱 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="例：淺草寺參拜"
              maxLength={100}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                ${errors.title ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">時間 *</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                  ${errors.time ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">預計時長</label>
              <DurationSelect
                value={form.duration}
                onChange={(v) => handleChange('duration', v)}
              />
            </div>
          </div>

          {/* Location with Places Autocomplete */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              <MapPin size={13} className="inline mr-1" />
              地點
            </label>
            {isLoaded ? (
              <Autocomplete
                onLoad={(ac) => { autocompleteRef.current = ac }}
                onPlaceChanged={onPlaceChanged}
              >
                <input
                  type="text"
                  defaultValue={form.address}
                  placeholder="搜尋地點或輸入地址"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="輸入地址"
                maxLength={200}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            )}
            {location && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <MapPin size={11} />
                已取得座標（地圖可顯示）
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">備註</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="提醒事項、訂位資訊、推薦菜色..."
              maxLength={500}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-0.5">{form.notes.length}/500</p>
          </div>

          {/* Website */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">官網</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://..."
              maxLength={300}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                ${errors.website ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">電話</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+81-3-1234-5678"
              maxLength={30}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                ${errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <p className="text-xs text-slate-400">* 為必填欄位</p>
        </div>

        <div className="px-5 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
            取消
          </button>
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            {isEdit ? '儲存變更' : '新增行程'}
          </button>
        </div>
      </div>
    </div>
  )
}
