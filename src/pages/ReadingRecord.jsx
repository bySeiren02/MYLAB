import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'

const ReadingRecord = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [books, setBooks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    startDate: '',
    endDate: '',
    rating: '',
    review: '',
    status: '읽는중',
  })

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = () => {
    const data = getStorage('reading_books', [])
    setBooks(data)
  }

  const saveBooks = (updatedBooks) => {
    setStorage('reading_books', updatedBooks)
    setBooks(updatedBooks)
  }

  const openModal = (book = null) => {
    if (book) {
      setEditingBook(book)
      setFormData({
        title: book.title,
        author: book.author || '',
        startDate: book.startDate || '',
        endDate: book.endDate || '',
        rating: book.rating || '',
        review: book.review || '',
        status: book.status || '읽는중',
      })
    } else {
      setEditingBook(null)
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        title: '',
        author: '',
        startDate: today,
        endDate: '',
        rating: '',
        review: '',
        status: '읽는중',
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBook(null)
  }

  const saveBook = () => {
    if (!formData.title) return

    if (editingBook) {
      const updated = books.map((b) =>
        b.id === editingBook.id ? { ...editingBook, ...formData } : b
      )
      saveBooks(updated)
    } else {
      const newBook = {
        id: Date.now(),
        ...formData,
      }
      saveBooks([...books, newBook])
    }
    closeModal()
  }

  const deleteBook = (id) => {
    if (window.confirm(t('deleteConfirm'))) {
      const updated = books.filter((b) => b.id !== id)
      saveBooks(updated)
    }
  }

  const statusColors = {
    읽는중: '#FFB6C1',
    완독: '#98FB98',
    중단: '#FF6347',
  }

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('readingRecord')}</h1>
        <button className="add-btn" onClick={() => openModal()}>
          {t('add')}
        </button>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">{t('noReadingRecords')}</div>
      ) : (
        <div className="item-list">
          {books.map((book) => (
            <div key={book.id} className="item-card">
              <div className="item-content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <h3 style={{ color: 'var(--color-secondary)', margin: 0 }}>{book.title}</h3>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: statusColors[book.status] || 'var(--color-secondary)',
                      color: 'var(--bg-primary)',
                      fontWeight: 'bold',
                    }}
                  >
                    {book.status}
                  </span>
                </div>
                {book.author && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    {language === 'ko' ? '저자' : 'Author'}: {book.author}
                  </div>
                )}
                {(book.startDate || book.endDate) && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    {book.startDate && `${language === 'ko' ? '시작' : 'Start'}: ${book.startDate}`}
                    {book.startDate && book.endDate && ' | '}
                    {book.endDate && `${language === 'ko' ? '완료' : 'End'}: ${book.endDate}`}
                  </div>
                )}
                {book.rating && (
                  <div style={{ color: '#FFD700', fontSize: '14px' }}>
                    {language === 'ko' ? '평점' : 'Rating'}: {'⭐'.repeat(parseInt(book.rating))} ({book.rating}/5)
                  </div>
                )}
                {book.review && (
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
                    {book.review}
                  </div>
                )}
              </div>
              <div className="item-actions">
                <button className="action-btn" onClick={() => openModal(book)}>
                  {t('edit')}
                </button>
                <button className="action-btn delete-btn" onClick={() => deleteBook(book.id)}>
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
              {editingBook ? t('editReadingRecord') : t('addReadingRecord')}
            </h2>
            <div className="form-group">
              <label className="form-label">제목 *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">저자</label>
              <input
                type="text"
                className="form-input"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">상태</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="읽는중">읽는중</option>
                <option value="완독">완독</option>
                <option value="중단">중단</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">시작일</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">완료일</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">평점 (1-5)</label>
              <input
                type="number"
                className="form-input"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                min="1"
                max="5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">독후감</label>
              <textarea
                className="form-textarea"
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                placeholder="독후감을 작성하세요..."
              />
            </div>
            <div className="form-actions">
              <button className="action-btn" onClick={closeModal}>
                취소
              </button>
              <button className="add-btn" onClick={saveBook}>
                저장
              </button>
              {editingBook && (
                <button
                  className="action-btn delete-btn"
                  onClick={() => {
                    deleteBook(editingBook.id)
                    closeModal()
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <BottomMenu />
    </div>
  )
}

export default ReadingRecord
