import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'

const CulturalLife = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  
  const culturalTypes = language === 'ko'
    ? ['영화', '연극', '뮤지컬', '전시회', '기타']
    : ['Movie', 'Play', 'Musical', 'Exhibition', 'Other']
  
  const [records, setRecords] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [formData, setFormData] = useState({
    type: culturalTypes[0],
    title: '',
    date: '',
    location: '',
    withWhom: '',
    thoughts: ''
  })

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = () => {
    const data = getStorage('cultural_life_records', [])
    setRecords(data)
  }

  const saveRecords = (updatedRecords) => {
    setStorage('cultural_life_records', updatedRecords)
    setRecords(updatedRecords)
  }

  const openModal = (record = null) => {
    if (record) {
      setEditingRecord(record)
      setFormData({
        type: record.type || culturalTypes[0],
        title: record.title || '',
        date: record.date || '',
        location: record.location || '',
        withWhom: record.withWhom || '',
        thoughts: record.thoughts || ''
      })
    } else {
      setEditingRecord(null)
      setFormData({
        type: culturalTypes[0],
        title: '',
        date: '',
        location: '',
        withWhom: '',
        thoughts: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRecord(null)
    setFormData({
      type: culturalTypes[0],
      title: '',
      date: '',
      location: '',
      withWhom: '',
      thoughts: ''
    })
  }

  const saveRecord = () => {
    if (!formData.title.trim()) return
    
    const record = {
      id: editingRecord?.id || Date.now(),
      type: formData.type,
      title: formData.title.trim(),
      date: formData.date,
      location: formData.location,
      withWhom: formData.withWhom,
      thoughts: formData.thoughts
    }
    
    if (editingRecord) {
      const updated = records.map(r => r.id === editingRecord.id ? record : r)
      saveRecords(updated)
    } else {
      saveRecords([...records, record])
    }
    
    closeModal()
  }

  const deleteRecord = (id) => {
    if (window.confirm(language === 'ko' ? '문화생활 기록을 삭제하시겠습니까?' : 'Are you sure you want to delete this cultural life record?')) {
      const updated = records.filter(r => r.id !== id)
      saveRecords(updated)
    }
  }

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('culturalLifePage')}</h1>
        <button className="add-btn" onClick={() => openModal()}>
          {t('add')}
        </button>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">{t('noCultural')}</div>
      ) : (
        <div className="item-list">
          {records.map((record) => (
            <div key={record.id} className="item-card">
              <div className="item-content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <h3 style={{ color: 'var(--color-secondary)', margin: 0 }}>{record.title}</h3>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: 'var(--card-bg)',
                      color: 'var(--color-text)',
                      fontWeight: 'bold',
                      border: '1px solid var(--card-border)'
                    }}
                  >
                    {record.type}
                  </span>
                </div>
                {record.date && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    <strong style={{ color: 'var(--color-secondary)' }}>{t('when')}:</strong> {record.date}
                  </div>
                )}
                {record.location && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    <strong style={{ color: 'var(--color-secondary)' }}>{t('where')}:</strong> {record.location}
                  </div>
                )}
                {record.withWhom && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    <strong style={{ color: 'var(--color-secondary)' }}>{t('withWhom')}:</strong> {record.withWhom}
                  </div>
                )}
                {record.thoughts && (
                  <div
                    style={{
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      marginTop: '10px',
                      padding: '10px',
                      background: 'var(--input-bg)',
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <strong style={{ color: 'var(--color-secondary)' }}>{t('thoughts')}:</strong> {record.thoughts}
                  </div>
                )}
              </div>
              <div className="item-actions">
                <button className="action-btn" onClick={() => openModal(record)}>
                  {t('edit')}
                </button>
                <button className="action-btn delete-btn" onClick={() => deleteRecord(record.id)}>
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--color-secondary)', marginBottom: '20px' }}>
              {editingRecord ? t('editCultural') : t('addCultural')}
            </h2>
            <div className="form-group">
              <label className="form-label">{t('culturalType')}</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {culturalTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('what')} *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={language === 'ko' ? '제목을 입력하세요...' : 'Enter title...'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('when')}</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('where')}</label>
              <input
                type="text"
                className="form-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={language === 'ko' ? '장소를 입력하세요...' : 'Enter location...'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('withWhom')}</label>
              <input
                type="text"
                className="form-input"
                value={formData.withWhom}
                onChange={(e) => setFormData({ ...formData, withWhom: e.target.value })}
                placeholder={language === 'ko' ? '누구와 함께 봤는지 입력하세요...' : 'Enter who you went with...'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('thoughts')}</label>
              <textarea
                className="form-textarea"
                value={formData.thoughts}
                onChange={(e) => setFormData({ ...formData, thoughts: e.target.value })}
                placeholder={language === 'ko' ? '느낀점을 입력하세요...' : 'Enter your thoughts...'}
              />
            </div>
            <div className="form-actions">
              <button className="action-btn" onClick={closeModal}>
                {t('cancel')}
              </button>
              <button className="add-btn" onClick={saveRecord}>
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomMenu />
    </div>
  )
}

export default CulturalLife
