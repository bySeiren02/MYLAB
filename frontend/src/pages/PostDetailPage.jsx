import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as postApi from '../api/postApi';
import * as commentApi from '../api/commentApi';
import { useAuth } from '../hooks/useAuth';

function CommentItem({ comment, user, postId, formatDate, onReply, onDelete, depth = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isReply = depth === 1;
  // 최상위 댓글(depth 0)이거나 parentId 없음 + 로그인 시 답글 버튼 표시
  const isTopLevel = depth === 0 || comment.parentId == null;
  const canReply = user && isTopLevel;
  const replies = comment.replies || [];

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onReply(postId, replyContent.trim(), comment.id);
      setReplyContent('');
      setShowReplyForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        marginBottom: '0.75rem',
        marginLeft: isReply ? '1.5rem' : 0,
        borderLeft: isReply ? '3px solid var(--border)' : undefined,
      }}
    >
      <div className="card-meta">
        {comment.authorName} · {formatDate(comment.createdAt)}
        {user && comment.authorId === user.id && (
          <button
            type="button"
            className="btn btn-danger"
            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={() => onDelete(comment.id)}
          >
            삭제
          </button>
        )}
      </div>
      <div className="card-content" style={{ marginTop: '0.25rem' }}>
        {comment.content}
      </div>
      {canReply && (
        <div style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
            onClick={() => setShowReplyForm((v) => !v)}
          >
            답글 달기
          </button>
        </div>
      )}
      {replies.length > 0 && (
        <div style={{ marginTop: '0.75rem', paddingLeft: '0.5rem' }}>
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              user={user}
              postId={postId}
              formatDate={formatDate}
              onReply={onReply}
              onDelete={onDelete}
              depth={1}
            />
          ))}
        </div>
      )}
      {showReplyForm && (
        <form onSubmit={handleSubmitReply} style={{ marginTop: '0.75rem', paddingLeft: '0.5rem' }}>
          <div className="form-group">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요"
              rows={2}
              style={{ fontSize: '0.875rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ fontSize: '0.875rem' }}>
            {submitting ? '등록 중...' : '답글 등록'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}
            onClick={() => { setShowReplyForm(false); setReplyContent(''); }}
          >
            취소
          </button>
        </form>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPost = async () => {
    try {
      const res = await postApi.getPost(id);
      if (res.success && res.data) setPost(res.data);
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  /** API가 평면 목록으로 줘도 트리(대댓글) 구조로 변환 */
  const normalizeComments = (list) => {
    if (!Array.isArray(list) || list.length === 0) return list;
    const hasReplies = list.some((c) => Array.isArray(c.replies));
    if (hasReplies) return list;
    const roots = list.filter((c) => c.parentId == null);
    const withParent = list.filter((c) => c.parentId != null);
    return roots.map((root) => ({
      ...root,
      replies: withParent.filter((r) => r.parentId === root.id),
    }));
  };

  const loadComments = async () => {
    try {
      const res = await commentApi.getComments(id);
      if (res.success && res.data) setComments(normalizeComments(res.data));
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    loadPost();
  }, [id]);

  useEffect(() => {
    if (post) loadComments();
  }, [post]);

  const handleDeletePost = async () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;
    try {
      await postApi.deletePost(id);
      if (typeof console !== 'undefined' && console.log) {
        console.log('[Post] Deleted', { postId: id });
      }
      navigate('/');
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) console.warn('[Post] Delete failed', err);
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || !user) return;
    setSubmitting(true);
    try {
      const res = await commentApi.createComment(Number(id), commentContent.trim());
      if (res.success && res.data) {
        const newComment = { ...res.data, replies: res.data.replies || [] };
        setComments((prev) => [...prev, newComment]);
        setCommentContent('');
        if (typeof console !== 'undefined' && console.log) {
          console.log('[Comment] Added', { commentId: res.data.id, postId: id });
        }
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) console.warn('[Comment] Add failed', err);
      alert(err.response?.data?.message || '댓글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (postId, content, parentId) => {
    try {
      const res = await commentApi.createComment(Number(postId), content, parentId);
      if (res.success && res.data) {
        const newReply = { ...res.data, replies: [] };
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), newReply] }
              : c
          )
        );
        if (typeof console !== 'undefined' && console.log) {
          console.log('[Comment] Reply added', { commentId: res.data.id, parentId });
        }
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) console.warn('[Comment] Reply failed', err);
      alert(err.response?.data?.message || '답글 등록에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;
    try {
      await commentApi.deleteComment(commentId);
      setComments((prev) => removeCommentById(prev, commentId));
      if (typeof console !== 'undefined' && console.log) {
        console.log('[Comment] Deleted', { commentId });
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) console.warn('[Comment] Delete failed', err);
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  function removeCommentById(list, targetId) {
    return list
      .filter((c) => c.id !== targetId)
      .map((c) => ({
        ...c,
        replies: (c.replies || []).filter((r) => r.id !== targetId),
      }));
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalCommentCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>불러오는 중...</p>;
  if (!post) return <p style={{ color: 'var(--text-muted)' }}>게시글을 찾을 수 없습니다.</p>;

  const isAuthor = user && post.authorId === user.id;

  return (
    <div>
      <div className="card">
        <div className="card-title">{post.title}</div>
        <div className="card-meta">
          {post.category || '미분류'} · {post.authorName} · {formatDate(post.createdAt)}
        </div>
        <div className="card-content" style={{ marginTop: '0.75rem' }}>
          {post.content}
        </div>
        {isAuthor && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Link to={`/posts/${id}/edit`} className="btn btn-secondary">
              수정
            </Link>
            <button type="button" className="btn btn-danger" onClick={handleDeletePost}>
              삭제
            </button>
          </div>
        )}
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>댓글 ({totalCommentCount})</h2>
        {user && (
          <form onSubmit={handleSubmitComment} style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 입력하세요"
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '등록 중...' : '댓글 등록'}
            </button>
          </form>
        )}
        {comments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>댓글이 없습니다.</p>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              user={user}
              postId={id}
              formatDate={formatDate}
              onReply={handleReply}
              onDelete={handleDeleteComment}
            />
          ))
        )}
      </section>
    </div>
  );
}
