import axios from '../utils/axios';

/**
 * PUT /api/users/me - 내 정보 수정
 */
export const updateMe = async (name) => {
  const { data } = await axios.put('/api/users/me', { name });
  return data;
};
