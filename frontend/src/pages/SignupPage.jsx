import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'

export default function SignupPage() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const users = getStorage('users', [])
    if (users.some((u) => u.email === email.trim())) {
      setError('이미 사용 중인 이메일입니다.')
      return
    }
    const newUser = { id: Date.now(), nickname: nickname.trim(), email: email.trim(), password }
    setStorage('users', [...users, newUser])
    setStorage('current_user', { email: newUser.email, nickname: newUser.nickname })
    navigate('/', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <form className="card" style={{ width: '100%', maxWidth: 420 }} onSubmit={onSubmit}>
        <h1 style={{ marginBottom: '1rem' }}>회원가입</h1>
        <div className="form-group">
          <label>닉네임</label>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} required />
        </div>
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
          회원가입
        </button>
        <div style={{ marginTop: '0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </div>
      </form>
    </div>
  )
}
