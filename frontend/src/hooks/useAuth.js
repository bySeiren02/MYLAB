import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * 인증 상태 및 로그인/로그아웃 훅 (AuthContext에서 전역 상태 사용)
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
