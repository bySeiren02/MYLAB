import { createContext, useContext, useState, useEffect } from 'react'
import { getStorage, setStorage } from '../utils/storage'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = getStorage('language', 'ko')
    return saved
  })

  useEffect(() => {
    setStorage('language', language)
  }, [language])

  const translations = {
    ko: {
      // 하단 메뉴
      plan: '계획',
      todoList: '할 일 목록',
      monthlyGoals: '월간 목표',
      yearlyGoals: '연간 목표',
      body: '신체',
      mealPlan: '식단',
      mealPlanExercise: '식단 & 운동',
      strengthTraining: '근력 운동',
      running: '러닝',
      care: '관리',
      supplements: '영양제',
      selfBeauty: '셀프 뷰티',
      dermatology: '피부과',
      grow: '성장',
      reading: '독서',
      study: '공부',
      culturalLife: '문화생활',
      home: '홈',
      
      // 상단 메뉴
      settings: '설정',
      language: '언어',
      theme: '테마',
      korean: '한국어',
      english: 'English',
      
      // 테마 이름
      midnight: '미드나잇',
      white: '화이트',
      black: '블랙',
      sky: '스카이',
      cotton: '코튼',
      blossom: '블라썸',
      
      // 공통
      add: '추가',
      edit: '수정',
      delete: '삭제',
      save: '저장',
      cancel: '취소',
      close: '닫기',
      confirm: '확인',
      progress: '진행률',
      empty: '없습니다',
      today: '오늘',
      yesterday: '어제',
      tomorrow: '내일',
      
      // 페이지 제목
      calendar: '캘린더',
      dailyTodo: '데일리 투두리스트',
      monthlyGoal: '월간 목표',
      yearlyGoal: '연간 목표',
      runningStopwatch: '러닝 스톱워치',
      diet: '식단',
      readingRecord: '독서 기록',
      studyPlan: '스터디 플랜',
      supplementsPage: '영양제',
      skincareRoutine: '요일별 피부 루틴',
      
      // MainPage
      moodQuestion: '유민님 오늘 기분은 어때요?',
      todayQuestion: '오늘의 질문',
      answerPlaceholder: '답변을 입력하세요...',
      todayDiet: '오늘의 다이어트',
      todayWeight: '오늘의 몸무게 (kg)',
      weightPlaceholder: '몸무게 입력',
      todayMeals: '오늘의 식단',
      todayExercises: '오늘의 운동',
      noMeals: '식단이 없습니다',
      noExercises: '운동이 없습니다',
      totalIntake: '총 섭취',
      totalBurn: '총 소모',
      moreItems: '개 더 보기',
      
      // Calendar
      work: '업무',
      personal: '개인',
      exercise: '운동',
      study: '공부',
      appointment: '약속',
      etc: '기타',
      
      // DailyTodo
      todoPlaceholder: '할 일을 입력하세요...',
      noTodos: '할 일이 없습니다. 추가해보세요!',
      routineManagement: '고정 루틴 관리',
      
      // Diet
      mealTypes: ['아침', '점심', '저녁', '간식'],
      exerciseTypes: ['유산소', '근력', '기타'],
      intakeCalories: '섭취 칼로리',
      burnCalories: '소모 칼로리',
      netCalories: '순 칼로리',
      addMeal: '식단 추가',
      editMeal: '식단 수정',
      addExercise: '운동 추가',
      editExercise: '운동 수정',
      exerciseType: '운동 종류',
      exerciseName: '운동명',
      exerciseDuration: '운동 시간 (분, 선택사항)',
      
      // RunningStopwatch
      warmup: '워밍업',
      runningSet: '러닝',
      walking: '워킹',
      cooldown: '쿨다운',
      totalExerciseTime: '총 운동 시간',
      minutes: '분',
      runningTime: '러닝 시간 (분)',
      walkingTime: '워킹 시간 (분)',
      repeat: '반복',
      set: '세트',
      endRunning: '러닝 끝내기',
      runningComplete: '러닝 완료! 🎉',
      runningHistory: '러닝 기록',
      exerciseTime: '운동 시간',
      
      // ReadingRecord
      noReadingRecords: '독서 기록이 없습니다. 추가해보세요!',
      addReadingRecord: '독서 기록 추가',
      editReadingRecord: '독서 기록 수정',
      deleteConfirm: '독서 기록을 삭제하시겠습니까?',
      
      // Supplements
      supplementPlaceholder: '영양제 이름을 입력하세요...',
      noSupplements: '영양제가 없습니다. 추가해보세요!',
      
      // SkincareRoutine
      skincarePlaceholder: '피부 루틴을 입력하세요...',
      weekday: '요일',
      
      // MonthlyGoal & YearlyGoal
      goalPlaceholder: '목표를 입력하세요...',
      noGoals: '목표가 없습니다. 추가해보세요!',
      icon: '아이콘',
      completed: '완료',
      year: '년',
      month: '월',
      
      // Diet
      weightLabel: '몸무게',
      
      // Cultural Life
      culturalLifePage: '문화생활',
      when: '언제',
      where: '어디서',
      withWhom: '누구랑',
      what: '뭐를',
      thoughts: '느낀점',
      addCultural: '문화생활 추가',
      editCultural: '문화생활 수정',
      noCultural: '문화생활 기록이 없습니다. 추가해보세요!',
      culturalType: '종류',
      culturalTypes: ['영화', '연극', '뮤지컬', '전시회', '기타'],
    },
    en: {
      // 하단 메뉴
      plan: 'PLAN',
      todoList: 'To-Do List',
      monthlyGoals: 'Monthly Goals',
      yearlyGoals: 'Yearly Goals',
      body: 'BODY',
      mealPlan: 'Meal Plan',
      mealPlanExercise: 'Meal & Exercise',
      strengthTraining: 'Strength Training',
      running: 'Running',
      care: 'CARE',
      supplements: 'Supplements',
      selfBeauty: 'Self Beauty',
      dermatology: 'Dermatology',
      grow: 'GROW',
      reading: 'Reading',
      study: 'Study',
      culturalLife: 'Cultural Life',
      home: 'Home',
      
      // 상단 메뉴
      settings: 'Settings',
      language: 'Language',
      theme: 'Theme',
      korean: '한국어',
      english: 'English',
      
      // 테마 이름
      midnight: 'Midnight',
      white: 'White',
      black: 'Black',
      sky: 'Sky',
      cotton: 'Cotton',
      blossom: 'Blossom',
      
      // 공통
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      confirm: 'Confirm',
      progress: 'Progress',
      empty: 'No items',
      today: 'Today',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      
      // 페이지 제목
      calendar: 'Calendar',
      dailyTodo: 'Daily To-Do List',
      monthlyGoal: 'Monthly Goals',
      yearlyGoal: 'Yearly Goals',
      runningStopwatch: 'Running Stopwatch',
      diet: 'Diet',
      readingRecord: 'Reading Record',
      studyPlan: 'Study Plan',
      supplementsPage: 'Supplements',
      skincareRoutine: 'Weekly Skincare Routine',
      
      // MainPage
      moodQuestion: 'How are you feeling today?',
      todayQuestion: "Today's Question",
      answerPlaceholder: 'Enter your answer...',
      todayDiet: "Today's Diet",
      todayWeight: "Today's Weight (kg)",
      weightPlaceholder: 'Enter weight',
      todayMeals: "Today's Meals",
      todayExercises: "Today's Exercises",
      noMeals: 'No meals',
      noExercises: 'No exercises',
      totalIntake: 'Total Intake',
      totalBurn: 'Total Burn',
      moreItems: 'more items',
      
      // Calendar
      work: 'Work',
      personal: 'Personal',
      exercise: 'Exercise',
      study: 'Study',
      appointment: 'Appointment',
      etc: 'Other',
      
      // DailyTodo
      todoPlaceholder: 'Enter a task...',
      noTodos: 'No tasks. Add one!',
      routineManagement: 'Routine Management',
      
      // Diet
      mealTypes: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
      exerciseTypes: ['Cardio', 'Strength', 'Other'],
      intakeCalories: 'Intake Calories',
      burnCalories: 'Burn Calories',
      netCalories: 'Net Calories',
      addMeal: 'Add Meal',
      editMeal: 'Edit Meal',
      addExercise: 'Add Exercise',
      editExercise: 'Edit Exercise',
      exerciseType: 'Exercise Type',
      exerciseName: 'Exercise Name',
      exerciseDuration: 'Duration (min, optional)',
      minutes: 'min',
      
      // RunningStopwatch
      warmup: 'Warmup',
      runningSet: 'Running',
      walking: 'Walking',
      cooldown: 'Cooldown',
      totalExerciseTime: 'Total Exercise Time',
      minutes: 'min',
      runningTime: 'Running Time (min)',
      walkingTime: 'Walking Time (min)',
      walkingTimeLabel: 'Walking Time',
      setsLabel: 'Sets',
      repeat: 'Repeat',
      set: 'Set',
      endRunning: 'End Running',
      runningComplete: 'Running Complete! 🎉',
      runningHistory: 'Running History',
      exerciseTime: 'Exercise Time',
      settings: 'Settings',
      setLabel: 'Set',
      addSet: 'Add Set',
      history: 'History',
      calories: 'Calories',
      expectedCalories: 'Expected Calories',
      actualCalories: 'Actual Calories',
      startRunning: 'Start Running',
      pause: 'Pause',
      resume: 'Resume',
      stop: 'Stop',
      alertMessage: 'At least one of warmup, running time, walking time, or cooldown must be greater than 0.',
      
      // ReadingRecord
      noReadingRecords: 'No reading records. Add one!',
      addReadingRecord: 'Add Reading Record',
      editReadingRecord: 'Edit Reading Record',
      deleteConfirm: 'Are you sure you want to delete this reading record?',
      
      // Supplements
      supplementPlaceholder: 'Enter supplement name...',
      noSupplements: 'No supplements. Add one!',
      
      // SkincareRoutine
      skincarePlaceholder: 'Enter skincare routine...',
      weekday: 'Weekday',
      
      // MonthlyGoal & YearlyGoal
      goalPlaceholder: 'Enter a goal...',
      noGoals: 'No goals. Add one!',
      icon: 'Icon',
      completed: 'Completed',
      year: 'Year',
      month: 'Month',
      
      // StudyPlan
      studyPlanPlaceholder: 'Enter your study plan...',
      noStudyPlans: 'No study plans. Add one!',
      
      // Diet
      weightLabel: 'Weight',
      
      // Cultural Life
      culturalLifePage: 'Cultural Life',
      when: 'When',
      where: 'Where',
      withWhom: 'With Whom',
      what: 'What',
      thoughts: 'Thoughts',
      addCultural: 'Add Cultural Life',
      editCultural: 'Edit Cultural Life',
      noCultural: 'No cultural life records. Add one!',
      culturalType: 'Type',
      culturalTypes: ['Movie', 'Play', 'Musical', 'Exhibition', 'Other'],
    }
  }

  const t = (key) => {
    return translations[language]?.[key] || key
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ko' ? 'en' : 'ko')
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
