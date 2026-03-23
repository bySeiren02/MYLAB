import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as postApi from '../api/postApi';
import { CATEGORY_OPTIONS } from '../constants/categories';

export default function BoardListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [category, setCategory] = useState('전체');

  useEffect(() => {
    let cancelled = false;
    const fetchPosts = async () => {
      try {
        const res = await postApi.getPostsByCategory(category, page, 20);
        if (res.success && res.data && !cancelled) {
          setPosts(res.data.content);
          setTotalPages(res.data.totalPages);
          if (typeof console !== 'undefined' && console.log) {
            console.log('[Board] Posts loaded', { page: res.data.number, total: res.data.totalElements });
          }
        }
      } catch (err) {
        if (!cancelled && typeof console !== 'undefined' && console.warn) {
          console.warn('[Board] Load failed', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPosts();
    return () => { cancelled = true; };
  }, [page, category]);

  const handleChangeCategory = (nextCategory) => {
    setCategory(nextCategory);
    setPage(0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && posts.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>목록을 불러오는 중...</p>;
  }

  return (
    <div className="page-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>게시판</h1>
        <Link to="/posts/new" className="btn btn-primary">
          글쓰기
        </Link>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {CATEGORY_OPTIONS.map((item) => (
          <button
            key={item}
            type="button"
            className={item === category ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => handleChangeCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {posts.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>등록된 게시글이 없습니다.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <Link key={post.id} to={`/posts/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div className="card-title">{post.title}</div>
                <div className="card-meta">
                  {post.category || '미분류'} · {post.authorName} · {formatDate(post.createdAt)}
                </div>
                <div className="card-content" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  {post.content}
                </div>
              </div>
            </Link>
          ))}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </button>
              <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
