import { Routes, Route, Navigate } from 'react-router-dom'
import BasePageLayout from './components/BasePageLayout'
import { getStorage } from './utils/storage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DailyTodoPage from './pages/DailyTodoPage'
import MonthlyGoalPage from './pages/MonthlyGoalPage'
import YearlyGoalPage from './pages/YearlyGoalPage'
import DietPage from './pages/DietPage'
import SupplementsPage from './pages/SupplementsPage'
import SkincarePage from './pages/SkincarePage'
import DermatologyPage from './pages/DermatologyPage'
import ReadingPage from './pages/ReadingPage'
import StudyPlanPage from './pages/StudyPlanPage'
import CulturalPage from './pages/CulturalPage'
import MovieDramaPage from './pages/MovieDramaPage'
import DatePage from './pages/DatePage'

function ProtectedRoute({ children }) {
  const user = getStorage('current_user', null)
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <BasePageLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/daily-todo" element={<DailyTodoPage />} />
        <Route path="/monthly-goal" element={<MonthlyGoalPage />} />
        <Route path="/yearly-goal" element={<YearlyGoalPage />} />
        <Route path="/diet" element={<DietPage />} />
        <Route path="/supplements" element={<SupplementsPage />} />
        <Route path="/skincare" element={<SkincarePage />} />
        <Route path="/dermatology" element={<DermatologyPage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/study-plan" element={<StudyPlanPage />} />
        <Route path="/movie-drama" element={<MovieDramaPage />} />
        <Route path="/cultural" element={<CulturalPage />} />
        <Route path="/date" element={<DatePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
