import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Trip, TripDay, TripEvent } from '../types'
import { mockTrips } from '../data/mockData'

// ── State ──────────────────────────────────────────────────────────────────

interface State {
  trips: Trip[]
}

type Action =
  | { type: 'SET_TRIPS'; trips: Trip[] }
  | { type: 'ADD_TRIP'; trip: Trip }
  | { type: 'UPDATE_TRIP'; trip: Trip }
  | { type: 'DELETE_TRIP'; tripId: string }
  | { type: 'ADD_DAY'; tripId: string; day: TripDay }
  | { type: 'ADD_EVENT'; tripId: string; dayId: string; event: TripEvent }
  | { type: 'UPDATE_EVENT'; tripId: string; dayId: string; event: TripEvent }
  | { type: 'DELETE_EVENT'; tripId: string; dayId: string; eventId: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TRIPS':
      return { trips: action.trips }

    case 'ADD_TRIP':
      return { trips: [...state.trips, action.trip] }

    case 'UPDATE_TRIP':
      return { trips: state.trips.map((t) => (t.id === action.trip.id ? action.trip : t)) }

    case 'DELETE_TRIP':
      return { trips: state.trips.filter((t) => t.id !== action.tripId) }

    case 'ADD_DAY':
      return {
        trips: state.trips.map((t) =>
          t.id === action.tripId ? { ...t, days: [...t.days, action.day] } : t
        ),
      }

    case 'ADD_EVENT':
      return {
        trips: state.trips.map((t) =>
          t.id === action.tripId
            ? {
                ...t,
                days: t.days.map((d) =>
                  d.id === action.dayId
                    ? { ...d, events: [...d.events, action.event] }
                    : d
                ),
              }
            : t
        ),
      }

    case 'UPDATE_EVENT':
      return {
        trips: state.trips.map((t) =>
          t.id === action.tripId
            ? {
                ...t,
                days: t.days.map((d) =>
                  d.id === action.dayId
                    ? {
                        ...d,
                        events: d.events.map((e) =>
                          e.id === action.event.id ? action.event : e
                        ),
                      }
                    : d
                ),
              }
            : t
        ),
      }

    case 'DELETE_EVENT':
      return {
        trips: state.trips.map((t) =>
          t.id === action.tripId
            ? {
                ...t,
                days: t.days.map((d) =>
                  d.id === action.dayId
                    ? { ...d, events: d.events.filter((e) => e.id !== action.eventId) }
                    : d
                ),
              }
            : t
        ),
      }

    default:
      return state
  }
}

// ── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'travelapp_trips_v1'

function loadFromStorage(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return mockTrips
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return mockTrips
    return parsed as Trip[]
  } catch {
    return mockTrips
  }
}

function saveToStorage(trips: Trip[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  } catch {
    // Storage quota exceeded — silently fail
  }
}

// ── Context ────────────────────────────────────────────────────────────────

interface TripContextValue {
  trips: Trip[]
  addTrip: (trip: Trip) => void
  updateTrip: (trip: Trip) => void
  deleteTrip: (tripId: string) => void
  addEvent: (tripId: string, dayId: string, event: TripEvent) => void
  updateEvent: (tripId: string, dayId: string, event: TripEvent) => void
  deleteEvent: (tripId: string, dayId: string, eventId: string) => void
}

const TripContext = createContext<TripContextValue | null>(null)

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { trips: loadFromStorage() })

  useEffect(() => {
    saveToStorage(state.trips)
  }, [state.trips])

  const value: TripContextValue = {
    trips: state.trips,
    addTrip: (trip) => dispatch({ type: 'ADD_TRIP', trip }),
    updateTrip: (trip) => dispatch({ type: 'UPDATE_TRIP', trip }),
    deleteTrip: (tripId) => dispatch({ type: 'DELETE_TRIP', tripId }),
    addEvent: (tripId, dayId, event) => dispatch({ type: 'ADD_EVENT', tripId, dayId, event }),
    updateEvent: (tripId, dayId, event) => dispatch({ type: 'UPDATE_EVENT', tripId, dayId, event }),
    deleteEvent: (tripId, dayId, eventId) =>
      dispatch({ type: 'DELETE_EVENT', tripId, dayId, eventId }),
  }

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTripContext must be used inside TripProvider')
  return ctx
}
