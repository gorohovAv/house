import { Routes, Route } from 'react-router-dom'
import HousePage from './pages/house'
import AnalyticsPage from './pages/analytics'
import ConstructionPage from './pages/construction'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HousePage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/construction" element={<ConstructionPage />} />
    </Routes>
  )
}

export default App
