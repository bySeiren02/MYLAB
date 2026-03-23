import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as postApi from '../api/postApi';
import { WRITABLE_CATEGORIES } from '../constants/categories';

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(WRITABLE_CATEGORIES[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchPost = async () => {
      try {
        const res = await postApi.getPost(id);
        if (res.success && res.data && !cancelled) {
          setTitle(res.data.title);
          setContent(res.data.content);
          setCategory(res.data.category || WRITABLE_CATEGORIES[0]);
        } else if (!cancelled) {
          navigate('/');
        }
      } catch {
        if (!cancelled) navigate('/');
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    };
    fetchPost();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await postApi.updatePost(id, title.trim(), content.trim(), category);
      if (res.success && res.data) {
        if (typeof console !== 'undefined' && console.log) {
          console.log('[Post] Updated', { postId: id });
        }
        navigate(`/posts/${id}`);
      } else {
        setError(res.message || '수정에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.message || '수정에 실패했습니다.');
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[Post] Update failed', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <p style={{ color: 'var(--text-muted)' }}>불러오는 중...</p>;

  return (
    <div className="page-header">
      <h1>글 수정</h1>
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
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
