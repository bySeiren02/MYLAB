import axios from '../utils/axios';

/**
 * GET /api/posts/{id}/comments - 댓글 목록
 */
export const getComments = async (postId) => {
  const { data } = await axios.get(`/api/posts/${postId}/comments`);
  return data;
};

/**
 * POST /api/comments - 댓글 작성 (parentId 있으면 대댓글)
 */
export const createComment = async (postId, content, parentId = null) => {
  const body = parentId ? { postId, content, parentId } : { postId, content };
  const { data } = await axios.post('/api/comments', body);
  return data;
};

/**
 * DELETE /api/comments/{id} - 댓글 삭제
 */
export const deleteComment = async (id) => {
  const { data } = await axios.delete(`/api/comments/${id}`);
  return data;
};
