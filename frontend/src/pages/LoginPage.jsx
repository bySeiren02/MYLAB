import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data) {
        const token = res.data.token;
        const userData = res.data.user || res.data; // user 객체 (백엔드: res.data.user)
        login(token, userData);
        await refreshUser(); // 상단 개인정보 갱신을 위해 서버에서 사용자 다시 로드
        if (typeof console !== 'undefined' && console.log) {
          console.log('[Login] Success', { email: userData?.email });
        }
        navigate('/');
      } else {
        setError(res.message || '로그인에 실패했습니다.');
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[Login] Failed', res.message);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || '로그인에 실패했습니다.';
      setError(message);
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[Login] Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-header">
      <h1>로그인</h1>
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
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </p>
    </div>
  );
}
