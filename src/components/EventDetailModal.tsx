import { useNavigate } from 'react-router-dom'
import type { TripEvent } from '../types'
import {
  X, MapPin, Clock, FileText, Globe, Phone, Navigation, Utensils,
  Camera, Bus, Hotel, MoreHorizontal
} from 'lucide-react'

const categoryConfig = {
  food: { label: '餐廳', color: 'bg-orange-100 text-orange-700', icon: Utensils },
  attraction: { label: '景點', color: 'bg-green-100 text-green-700', icon: Camera },
  transport: { label: '交通', color: 'bg-blue-100 text-blue-700', icon: Bus },
  hotel: { label: '住宿', color: 'bg-purple-100 text-purple-700', icon: Hotel },
  other: { label: '其他', color: 'bg-slate-100 text-slate-600', icon: MoreHorizontal },
}

interface Props {
  event: TripEvent
  tripId: string
  onClose: () => void
}

export default function EventDetailModal({ event, tripId, onClose }: Props) {
  const navigate = useNavigate()
  const cfg = categoryConfig[event.category]
  const Icon = cfg.icon

  function openGoogleMaps() {
    if (!event.location) return
    const { lat, lng } = event.location
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, '_blank')
  }

  function openDirections() {
    if (!event.location) return
    const { lat, lng } = event.location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, '_blank')
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${cfg.color}`}>
              <Icon size={18} />
            </div>
            <div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                {cfg.label}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1 leading-tight">
                {event.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Details */}
        <div className="px-5 pb-5 space-y-3">
          {/* Time + Duration */}
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Clock size={15} className="text-slate-400" />
            <span>
              {event.time}
              {event.duration && event.duration !== '—' && (
                <span className="text-slate-400 ml-2">· {event.duration}</span>
              )}
            </span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <MapPin size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="leading-snug">{event.location.address}</span>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <FileText size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{event.notes}</span>
            </div>
          )}

          {/* Website */}
          {event.website && (
            <div className="flex items-center gap-3 text-sm">
              <Globe size={15} className="text-slate-400" />
              <a
                href={event.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                {event.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {/* Phone */}
          {event.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone size={15} className="text-slate-400" />
              <a href={`tel:${event.phone}`} className="text-blue-600 hover:underline">
                {event.phone}
              </a>
            </div>
          )}

          {/* Map buttons */}
          {event.location && (
            <div className="pt-2 flex gap-3">
              <button
                onClick={openGoogleMaps}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <MapPin size={15} />
                看地圖位置
              </button>
              <button
                onClick={openDirections}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Navigation size={15} />
                導航前往
              </button>
            </div>
          )}

          {/* View on trip map */}
          <button
            onClick={() => { navigate(`/trip/${tripId}/map?focus=${event.id}`); onClose() }}
            className="w-full text-sm text-blue-600 hover:text-blue-700 py-1 transition-colors"
          >
            在行程地圖上查看全部地點 →
          </button>
        </div>
      </div>
    </div>
  )
}
