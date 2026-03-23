import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.signup(email, password, name);
      if (res.success && res.data) {
        const token = res.data.token;
        const userData = res.data.user || res.data;
        login(token, userData);
        await refreshUser();
        if (typeof console !== 'undefined' && console.log) {
          console.log('[Signup] Success', { email: userData?.email });
        }
        navigate('/');
      } else {
        setError(res.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      const message = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(message);
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[Signup] Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-header">
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', marginTop: '1.5rem' }}>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">비밀번호 (6자 이상)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </div>
  );
}
