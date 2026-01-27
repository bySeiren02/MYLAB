import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage, getDateKey } from '../utils/storage'
import { getQuestionForDate } from '../utils/questions'
import { moodIcons } from '../utils/moodIcons'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './MainPage.css'

const MainPage = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMood, setSelectedMood] = useState(null)
  const [questionAnswer, setQuestionAnswer] = useState('')
  const [dailyData, setDailyData] = useState(null)
  const [dietData, setDietData] = useState({
    weight: '',
    meals: [],
    exercises: [],
  })

  useEffect(() => {
    loadDailyData()
    loadDietData()
  }, [currentDate])

  const loadDailyData = () => {
    const dateKey = getDateKey(currentDate)
    const data = getStorage(`diary_${dateKey}`, {
      mood: null,
      questionAnswer: '',
    })
    setDailyData(data)
    setSelectedMood(data.mood)
    setQuestionAnswer(data.questionAnswer || '')
  }

  const loadDietData = () => {
    const dateKey = getDateKey(currentDate)
    const data = getStorage(`diet_${dateKey}`, {
      weight: '',
      meals: [],
      exercises: [],
    })
    setDietData(data)
  }

  const saveDailyData = () => {
    const dateKey = getDateKey(currentDate)
    const data = {
      mood: selectedMood,
      questionAnswer: questionAnswer,
    }
    setStorage(`diary_${dateKey}`, data)
    setDailyData(data)
  }

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood)
    const dateKey = getDateKey(currentDate)
    const data = {
      ...dailyData,
      mood: mood,
    }
    setStorage(`diary_${dateKey}`, data)
    setDailyData(data)
  }

  const handleQuestionAnswerChange = (e) => {
    setQuestionAnswer(e.target.value)
  }

  const handleQuestionAnswerBlur = () => {
    saveDailyData()
  }

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const weekdays = language === 'ko' 
      ? ['일', '월', '화', '수', '목', '금', '토']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weekday = weekdays[date.getDay()]
    return `${year}.${month}.${day} (${weekday})`
  }

  const totalMealCalories = dietData.meals.reduce((sum, m) => sum + (m.calories || 0), 0)
  const totalExerciseCalories = dietData.exercises.reduce((sum, e) => sum + (e.calories || 0), 0)

  return (
    <div className="main-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('home')}</h1>
      </div>
      {/* 상단: 날짜 선택 */}
      <div className="date-selector">
        <button className="date-btn" onClick={goToPreviousDay}>
          &lt;
        </button>
        <div className="date-display">{formatDate(currentDate)}</div>
        <button className="date-btn" onClick={goToNextDay}>
          &gt;
        </button>
      </div>

      {/* 중간: 일기 섹션 */}
      <div className="diary-section">
        <div className="mood-section">
          <h2>{t('moodQuestion')}</h2>
          <div className="mood-icons">
            {moodIcons.map((mood) => {
              const moodLabels = {
                ko: { 1: '행복', 2: '슬픔', 3: '화남', 4: '피곤', 5: '평온', 6: '고민', 7: '신남', 8: '우울', 9: '자신감', 10: '감사' },
                en: { 1: 'Happy', 2: 'Sad', 3: 'Angry', 4: 'Tired', 5: 'Calm', 6: 'Worried', 7: 'Excited', 8: 'Depressed', 9: 'Confident', 10: 'Grateful' }
              }
              return (
                <button
                  key={mood.id}
                  className={`mood-icon-btn ${selectedMood?.id === mood.id ? 'selected' : ''}`}
                  onClick={() => handleMoodSelect(mood)}
                  style={{
                    backgroundColor: selectedMood?.id === mood.id ? mood.color : 'transparent',
                    borderColor: mood.color,
                  }}
                >
                  <span className="mood-emoji">{mood.emoji}</span>
                  <span className="mood-label">{moodLabels[language]?.[mood.id] || mood.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="question-section">
          <h2>{t('todayQuestion')}</h2>
          <p className="question-text">{getQuestionForDate(currentDate)}</p>
          <textarea
            className="question-answer"
            placeholder={t('answerPlaceholder')}
            value={questionAnswer}
            onChange={handleQuestionAnswerChange}
            onBlur={handleQuestionAnswerBlur}
          />
        </div>

      </div>
      <BottomMenu />
    </div>
  )
}

export default MainPage
