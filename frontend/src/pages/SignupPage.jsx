import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'

export default function SignupPage() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('female')
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const id = username.trim()
    if (!id) {
      setError('아이디를 입력해 주세요.')
      return
    }
    const users = getStorage('users', [])
    if (users.some((u) => (u.username || u.email) === id)) {
      setError('이미 사용 중인 아이디입니다.')
      return
    }
    const newUser = {
      id: Date.now(),
      nickname: nickname.trim() || id,
      username: id,
      password,
      gender,
    }
    setStorage('users', [...users, newUser])
    setStorage('current_user', {
      username: newUser.username,
      nickname: newUser.nickname,
      gender: newUser.gender,
    })
    navigate('/', { replace: true })
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 'auto',
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
        <h1 style={{ marginBottom: '1rem' }}>회원가입</h1>
        <div className="form-group">
          <label>닉네임</label>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="표시 이름 (비워두면 아이디와 동일)" />
        </div>
        <div className="form-group">
          <label>아이디</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="form-group">
          <label>비밀번호</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" required />
        </div>
        <div className="form-group">
          <label>성별</label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} />
              여자
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} />
              남자
            </label>
          </div>
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
