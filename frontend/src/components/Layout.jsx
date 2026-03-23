import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/** localStorage에 저장된 user 백업 (Context 갱신 전 표시용) */
function getStoredUser() {
  try {
    const s = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

/**
 * 공통 레이아웃: 상단 네비게이션, 로그인/로그아웃
 */
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayUser = user || getStoredUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1rem',
          background: 'var(--surface)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
            MyLab
          </Link>
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/">기록 허브</Link>
            <Link to="/board">게시판</Link>
            {displayUser ? (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{displayUser.name}</span>
                <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login">로그인</Link>
                <Link to="/signup">회원가입</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main style={{ flex: 1, padding: '1.5rem 0' }}>
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
