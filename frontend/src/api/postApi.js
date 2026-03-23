import axios from '../utils/axios';

/**
 * GET /api/posts - 게시글 목록
 */
export const getPosts = async (page = 0, size = 20) => {
  const { data } = await axios.get('/api/posts', { params: { page, size } });
  return data;
};

export const getPostsByCategory = async (category, page = 0, size = 20) => {
  const params = { page, size };
  if (category && category !== '전체') {
    params.category = category;
  }
  const { data } = await axios.get('/api/posts', { params });
  return data;
};

/**
 * GET /api/posts/{id} - 게시글 상세
 */
export const getPost = async (id) => {
  const { data } = await axios.get(`/api/posts/${id}`);
  return data;
};

/**
 * POST /api/posts - 게시글 작성
 */
export const createPost = async (title, content, category) => {
  const { data } = await axios.post('/api/posts', { title, content, category });
  return data;
};

/**
 * PUT /api/posts/{id} - 게시글 수정
 */
export const updatePost = async (id, title, content, category) => {
  const { data } = await axios.put(`/api/posts/${id}`, { title, content, category });
  return data;
};

/**
 * DELETE /api/posts/{id} - 게시글 삭제
 */
export const deletePost = async (id) => {
  const { data } = await axios.delete(`/api/posts/${id}`);
  return data;
};
