import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as postApi from '../api/postApi';
import { WRITABLE_CATEGORIES } from '../constants/categories';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(WRITABLE_CATEGORIES[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await postApi.createPost(title.trim(), content.trim(), category);
      if (res.success && res.data) {
        if (typeof console !== 'undefined' && console.log) {
          console.log('[Post] Created', { postId: res.data.id, title: res.data.title });
        }
        navigate(`/posts/${res.data.id}`);
      } else {
        setError(res.message || '작성에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.message || '작성에 실패했습니다.');
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[Post] Create failed', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-header">
      <h1>글쓰기</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', marginTop: '1.5rem' }}>
        <div className="form-group">
          <label htmlFor="category">카테고리</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {WRITABLE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={500}
            placeholder="제목을 입력하세요"
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="내용을 입력하세요"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '등록 중...' : '등록'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
