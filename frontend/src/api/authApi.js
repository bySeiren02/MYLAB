import axios from '../utils/axios';

/**
 * POST /api/auth/signup - 회원가입
 */
export const signup = async (email, password, name) => {
  const { data } = await axios.post('/api/auth/signup', { email, password, name });
  return data;
};

/**
 * POST /api/auth/login - 로그인
 */
export const login = async (email, password) => {
  const { data } = await axios.post('/api/auth/login', { email, password });
  return data;
};

/**
 * GET /api/auth/me - 현재 사용자 정보
 */
export const getMe = async () => {
  const { data } = await axios.get('/api/auth/me');
  return data;
};
