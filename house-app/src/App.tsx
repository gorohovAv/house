import { Routes, Route } from 'react-router-dom'
import { TourProvider } from './components/TourProvider'
import TourOverlay from './components/TourOverlay'
import OnboardingPage from './pages/onboarding'
import HousePage from './pages/house'
import AnalyticsPage from './pages/analytics'
import ConstructionPage from './pages/construction'
import './App.css'

function App() {
  return (
    <TourProvider>
      <TourOverlay>
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/plan" element={<HousePage />} />
          <Route path="/construction" element={<ConstructionPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </TourOverlay>
    </TourProvider>
  )
}

export default App
