import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTripContext } from '../context/TripContext'
import type { TripEvent } from '../types'
import { ArrowLeft, Map, Utensils, Camera, Bus, Hotel, MoreHorizontal, Plus, Pencil, Trash2, FileSpreadsheet } from 'lucide-react'
import EventDetailModal from '../components/EventDetailModal'
import EventForm from '../components/EventForm'
import ConfirmDialog from '../components/ConfirmDialog'
import ExcelImportModal from '../components/ExcelImportModal'

const categoryConfig = {
  food: { label: '餐廳', color: 'bg-orange-100 text-orange-700', icon: Utensils },
  attraction: { label: '景點', color: 'bg-green-100 text-green-700', icon: Camera },
  transport: { label: '交通', color: 'bg-blue-100 text-blue-700', icon: Bus },
  hotel: { label: '住宿', color: 'bg-purple-100 text-purple-700', icon: Hotel },
  other: { label: '其他', color: 'bg-slate-100 text-slate-600', icon: MoreHorizontal },
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })
}

export default function TripPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { trips, addEvent, updateEvent, deleteEvent } = useTripContext()

  const [viewingEvent, setViewingEvent] = useState<TripEvent | null>(null)
  const [editingEvent, setEditingEvent] = useState<TripEvent | undefined>()
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showExcelImport, setShowExcelImport] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState<{ dayId: string; event: TripEvent } | undefined>()
  const [activeDay, setActiveDay] = useState(0)

  const trip = trips.find((t) => t.id === id)
  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        找不到此行程
      </div>
    )
  }

  const tripId = trip.id
  const day = trip.days[activeDay]

  function handleExcelImport(events: { dayId: string; event: TripEvent }[]) {
    events.forEach(({ dayId, event }) => addEvent(tripId, dayId, event))
  }

  function handleSaveEvent(event: TripEvent) {
    if (editingEvent) {
      updateEvent(tripId, day.id, event)
    } else {
      addEvent(tripId, day.id, event)
    }
    setEditingEvent(undefined)
    setShowAddEvent(false)
  }

  function handleDeleteConfirmed() {
    if (deletingEvent) {
      deleteEvent(tripId, deletingEvent.dayId, deletingEvent.event.id)
      setDeletingEvent(undefined)
      if (viewingEvent?.id === deletingEvent.event.id) setViewingEvent(null)
    }
  }

  // Sort events by time
  const sortedEvents = [...day.events].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              返回
            </button>
            <button
              onClick={() => navigate(`/trip/${id}/map`)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Map size={15} />
              查看地圖
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{trip.emoji}</span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{trip.name}</h1>
              <p className="text-sm text-slate-500">{trip.destination}・{trip.country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="max-w-2xl mx-auto px-4 flex gap-1 py-2">
          {trip.days.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => setActiveDay(idx)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeDay === idx
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Day {idx + 1}
              {d.label && (
                <span className={`ml-1.5 text-xs ${activeDay === idx ? 'text-blue-100' : 'text-slate-400'}`}>
                  {d.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-500">
            {formatDateHeader(day.date)}・{sortedEvents.length} 個行程
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExcelImport(true)}
              className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <FileSpreadsheet size={15} />
              匯入 Excel
            </button>
            <span className="text-slate-200">|</span>
            <button
              onClick={() => setShowAddEvent(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={15} />
              新增行程
            </button>
          </div>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">📅</div>
            <p className="font-medium">這天還沒有行程</p>
            <p className="text-sm mt-1">點擊「新增行程」開始安排</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[52px] top-0 bottom-0 w-px bg-slate-200" />
            <div className="space-y-1">
              {sortedEvents.map((event) => {
                const cfg = categoryConfig[event.category]
                const Icon = cfg.icon
                return (
                  <div key={event.id} className="flex items-start gap-4 group">
                    {/* Time */}
                    <div className="w-[52px] text-right flex-shrink-0 pt-3.5">
                      <span className="text-xs font-mono text-slate-400">{event.time}</span>
                    </div>
                    {/* Dot */}
                    <div className="relative flex-shrink-0 flex items-start justify-center w-0 pt-3.5">
                      <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-500 transition-colors z-10" />
                    </div>
                    {/* Card */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 mb-3 hover:border-blue-200 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => setViewingEvent(event)}
                          className="flex items-start gap-2.5 flex-1 text-left min-w-0"
                        >
                          <div className={`p-1.5 rounded-lg ${cfg.color} flex-shrink-0`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm leading-snug">
                              {event.title}
                            </p>
                            {event.location && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate">
                                {event.location.address}
                              </p>
                            )}
                            {event.notes && (
                              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                                {event.notes}
                              </p>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {event.duration && (
                            <span className="text-xs text-slate-400 mr-1">{event.duration}</span>
                          )}
                          <button
                            onClick={() => { setEditingEvent(event); setShowAddEvent(true) }}
                            className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeletingEvent({ dayId: day.id, event })}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewingEvent && !showAddEvent && (
        <EventDetailModal
          event={viewingEvent}
          tripId={id!}
          onClose={() => setViewingEvent(null)}
        />
      )}

      {(showAddEvent || editingEvent) && (
        <EventForm
          existingEvent={editingEvent}
          onSave={handleSaveEvent}
          onClose={() => { setShowAddEvent(false); setEditingEvent(undefined) }}
        />
      )}

      {deletingEvent && (
        <ConfirmDialog
          title="刪除行程"
          message={`確定要刪除「${deletingEvent.event.title}」嗎？`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeletingEvent(undefined)}
        />
      )}

      {showExcelImport && (
        <ExcelImportModal
          trip={trip}
          onImport={handleExcelImport}
          onClose={() => setShowExcelImport(false)}
        />
      )}
    </div>
  )
}
