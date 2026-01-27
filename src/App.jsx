import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import MainPage from './pages/MainPage'
import RunningStopwatch from './pages/RunningStopwatch'
import DailyTodo from './pages/DailyTodo'
import Calendar from './pages/Calendar'
import MonthlyGoal from './pages/MonthlyGoal'
import YearlyGoal from './pages/YearlyGoal'
import Diet from './pages/Diet'
import ReadingRecord from './pages/ReadingRecord'
import StudyPlan from './pages/StudyPlan'
import Supplements from './pages/Supplements'
import SkincareRoutine from './pages/SkincareRoutine'
import Dermatology from './pages/Dermatology'
import CulturalLife from './pages/CulturalLife'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/running" element={<RunningStopwatch />} />
            <Route path="/daily-todo" element={<DailyTodo />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/monthly-goal" element={<MonthlyGoal />} />
            <Route path="/yearly-goal" element={<YearlyGoal />} />
            <Route path="/diet" element={<Diet />} />
            <Route path="/reading" element={<ReadingRecord />} />
            <Route path="/study-plan" element={<StudyPlan />} />
            <Route path="/supplements" element={<Supplements />} />
            <Route path="/skincare" element={<SkincareRoutine />} />
            <Route path="/dermatology" element={<Dermatology />} />
            <Route path="/cultural" element={<CulturalLife />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
