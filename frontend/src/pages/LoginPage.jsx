import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'

function matchLoginId(user, loginId) {
  const id = user.username || user.email
  return id === loginId
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const loginId = username.trim()
    const users = getStorage('users', [])
    const user = users.find((u) => matchLoginId(u, loginId) && u.password === password)
    if (!user) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      return
    }
    setStorage('current_user', {
      username: user.username || user.email,
      nickname: user.nickname || user.username || user.email,
      gender: user.gender || 'male',
    })
    navigate('/', { replace: true })
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'max(1rem, env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px)) max(1rem, env(safe-area-inset-bottom, 0px)) max(1rem, env(safe-area-inset-left, 0px))',
      }}
    >
      <form className="card" style={{ width: '100%', maxWidth: 420 }} onSubmit={onSubmit}>
        <h1 style={{ marginBottom: '1rem' }}>로그인</h1>
        <div className="form-group">
          <label>아이디</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="form-group">
          <label>비밀번호</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
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
