import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { useTripContext } from '../context/TripContext'
import type { TripEvent } from '../types'
import { ArrowLeft, Navigation, Utensils, Camera, Bus, Hotel, MoreHorizontal, AlertCircle } from 'lucide-react'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

const categoryConfig = {
  food: { label: '餐廳', color: '#ea580c', icon: Utensils },
  attraction: { label: '景點', color: '#16a34a', icon: Camera },
  transport: { label: '交通', color: '#2563eb', icon: Bus },
  hotel: { label: '住宿', color: '#9333ea', icon: Hotel },
  other: { label: '其他', color: '#64748b', icon: MoreHorizontal },
}

const mapContainerStyle = { width: '100%', height: '100%' }
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
}

export default function MapPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const focusId = searchParams.get('focus')
  const { trips } = useTripContext()

  const trip = trips.find((t) => t.id === id)
  const locations = trip
    ? trip.days.flatMap((day) => day.events.filter((e) => e.location && e.location.lat !== 0))
    : []

  const [selected, setSelected] = useState<TripEvent | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY ?? '',
  })

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), [])

  useEffect(() => {
    if (!map || locations.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    locations.forEach((e) => {
      if (e.location) bounds.extend({ lat: e.location.lat, lng: e.location.lng })
    })
    map.fitBounds(bounds, 60)

    if (focusId) {
      const found = locations.find((e) => e.id === focusId)
      if (found?.location) {
        setTimeout(() => {
          map.panTo({ lat: found.location!.lat, lng: found.location!.lng })
          map.setZoom(16)
          setSelected(found)
        }, 500)
      }
    }
  }, [map, locations.length, focusId])

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        找不到此行程
      </div>
    )
  }

  function openDirections(event: TripEvent) {
    if (!event.location) return
    const { lat, lng } = event.location
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => navigate(`/trip/${id}`)} className="p-2 hover:bg-slate-100 rounded-xl">
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <h1 className="font-bold text-slate-900">{trip.name}・地圖</h1>
          </div>
        </div>
        <div className="max-w-md mx-auto px-6 py-12 text-center">
          <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">需要 Google Maps API Key</h2>
          <p className="text-slate-500 text-sm">請在 .env 檔案中填入 VITE_GOOGLE_MAPS_API_KEY</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        地圖載入失敗，請檢查 API Key 是否正確
      </div>
    )
  }

  const defaultCenter = locations[0]?.location ?? { lat: 35.6762, lng: 139.6503 }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(`/trip/${id}`)} className="p-2 hover:bg-slate-100 rounded-xl">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-bold text-slate-900">{trip.name}・地圖</h1>
          <span className="text-sm text-slate-400 ml-auto">{locations.length} 個地點</span>
        </div>
      </div>

      <div className="flex-1 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={{ lat: defaultCenter.lat, lng: defaultCenter.lng }}
            zoom={12}
            options={mapOptions}
            onLoad={onLoad}
          >
            {locations.map((event, idx) => {
              if (!event.location) return null
              const cfg = categoryConfig[event.category]
              return (
                <Marker
                  key={event.id}
                  position={{ lat: event.location.lat, lng: event.location.lng }}
                  label={{ text: String(idx + 1), color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: cfg.color,
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                    scale: 14,
                  }}
                  onClick={() => setSelected(event)}
                />
              )
            })}

            {selected?.location && (
              <InfoWindow
                position={{ lat: selected.location.lat, lng: selected.location.lng }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="min-w-[180px] max-w-[240px]">
                  <p className="font-semibold text-slate-900 text-sm">{selected.title}</p>
                  {selected.location.address && (
                    <p className="text-xs text-slate-500 mt-1">{selected.location.address}</p>
                  )}
                  {selected.notes && <p className="text-xs text-slate-600 mt-1.5">{selected.notes}</p>}
                  <button
                    onClick={() => openDirections(selected)}
                    className="mt-2.5 flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 w-full justify-center"
                  >
                    <Navigation size={12} />
                    一鍵導航
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            地圖載入中...
          </div>
        )}
      </div>

      {/* Bottom strip */}
      <div className="bg-white border-t border-slate-200 flex-shrink-0">
        {locations.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-4">尚未有含地點資訊的行程</p>
        ) : (
          <div className="flex overflow-x-auto gap-2 p-3">
            {locations.map((event, idx) => {
              const cfg = categoryConfig[event.category]
              return (
                <button
                  key={event.id}
                  onClick={() => {
                    if (map && event.location) {
                      map.panTo({ lat: event.location.lat, lng: event.location.lng })
                      map.setZoom(16)
                      setSelected(event)
                    }
                  }}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors
                    ${selected?.id === event.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <span
                    className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.color }}
                  >
                    {idx + 1}
                  </span>
                  <span className="whitespace-nowrap font-medium">{event.title}</span>
                  <span className="text-xs text-slate-400">{event.time}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
