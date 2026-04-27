import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripContext } from '../context/TripContext'
import type { Trip } from '../types'
import TripForm from '../components/TripForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { MapPin, Calendar, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })
}

function tripDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1
}

export default function HomePage() {
  const navigate = useNavigate()
  const { trips, addTrip, updateTrip, deleteTrip } = useTripContext()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>()
  const [deletingTripId, setDeletingTripId] = useState<string | undefined>()

  function handleSaveTrip(trip: Trip) {
    if (editingTrip) {
      updateTrip(trip)
    } else {
      addTrip(trip)
    }
    setEditingTrip(undefined)
  }

  function handleDeleteConfirmed() {
    if (deletingTripId) {
      deleteTrip(deletingTripId)
      setDeletingTripId(undefined)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">我的旅行</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {trips.length} 個行程</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          新增旅行
        </button>
      </div>

      {/* Trip list */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between">
              <button
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {trip.emoji}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {trip.name}
                  </h2>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                    <MapPin size={13} />
                    <span>{trip.destination}・{trip.country}</span>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                  onClick={() => setEditingTrip(trip)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="編輯"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeletingTripId(trip.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="刪除"
                >
                  <Trash2 size={15} />
                </button>
                <ChevronRight size={18} className="text-slate-300 ml-1" />
              </div>
            </div>

            <button
              onClick={() => navigate(`/trip/${trip.id}`)}
              className="w-full mt-4 text-left"
            >
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>{tripDuration(trip.startDate, trip.endDate)} 天</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>{trip.days.reduce((acc, d) => acc + d.events.length, 0)} 個行程</span>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {trip.days.map((day, idx) => (
                  <span
                    key={day.id}
                    className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
                  >
                    {day.label ?? `Day ${idx + 1}`}
                  </span>
                ))}
              </div>
            </button>
          </div>
        ))}

        {trips.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">✈️</div>
            <p className="text-lg font-medium">還沒有旅行計畫</p>
            <p className="text-sm mt-1">點擊「新增旅行」開始規劃</p>
          </div>
        )}
      </div>

      {(showAddForm || editingTrip) && (
        <TripForm
          existingTrip={editingTrip}
          onSave={handleSaveTrip}
          onClose={() => { setShowAddForm(false); setEditingTrip(undefined) }}
        />
      )}

      {deletingTripId && (
        <ConfirmDialog
          title="刪除旅行"
          message={`確定要刪除「${trips.find(t => t.id === deletingTripId)?.name}」嗎？此操作無法復原。`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeletingTripId(undefined)}
        />
      )}
    </div>
  )
}
