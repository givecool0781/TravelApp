import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TripPage from './pages/TripPage'
import MapPage from './pages/MapPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trip/:id" element={<TripPage />} />
        <Route path="/trip/:id/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  )
}
