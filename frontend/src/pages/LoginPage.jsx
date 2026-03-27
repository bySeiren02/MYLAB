import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const users = getStorage('users', [])
    const user = users.find((u) => u.email === email.trim() && u.password === password)
    if (!user) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      return
    }
    setStorage('current_user', { email: user.email, nickname: user.nickname })
    navigate('/', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <form className="card" style={{ width: '100%', maxWidth: 420 }} onSubmit={onSubmit}>
        <h1 style={{ marginBottom: '1rem' }}>로그인</h1>
        <div className="form-group">
          <label>이메일</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="form-group">
          <label>비밀번호</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
          로그인
        </button>
        <div style={{ marginTop: '0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          계정이 없나요? <Link to="/signup">회원가입</Link>
        </div>
      </form>
    </div>
  )
}
