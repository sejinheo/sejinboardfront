import { useState, useEffect } from 'react';
import { commentsApi } from '../../../services/api/comments';
import { likesApi } from '../../../services/api/likes';
import { tokenUtils } from '../../../utils/token';
import AlertModal from '../../../components/AlertModal';
import '../styles/CommentItem.css';

function CommentItem({ comment, articleId, onReply, onRefresh, allComments, showReplies = false }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [showRepliesState, setShowRepliesState] = useState(showReplies);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });

  useEffect(() => {
    const loadLikeCount = async () => {
      try {
        const count = await likesApi.getCommentLikeCount(comment.id);
        setLikeCount(count);
      } catch (err) {
        console.error(`댓글 좋아요 수 로딩 실패 (댓글 ID: ${comment.id}):`, err);
      }
    };

    loadLikeCount();

    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    if (likedComments.includes(comment.id)) {
      setLiked(true);
    }
  }, [comment.id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLike = async () => {
    if (liking) return;
    
    const token = tokenUtils.getAccessToken();
    if (!token) {
      setAlertModal({ 
        isOpen: true, 
        message: '로그인이 필요합니다.', 
        type: 'warning',
        onClose: () => {
          setAlertModal({ isOpen: false, message: '', type: 'info' });
          window.location.href = '/login';
        }
      });
      return;
    }

    setLiking(true);
    try {
      const response = await likesApi.toggleCommentLike(comment.id);
      setLiked(response.liked);
      setLikeCount(response.likeCount);
      
      const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
      if (response.liked) {
        if (!likedComments.includes(comment.id)) {
          likedComments.push(comment.id);
        }
      } else {
        const index = likedComments.indexOf(comment.id);
        if (index > -1) {
          likedComments.splice(index, 1);
        }
      }
      localStorage.setItem('likedComments', JSON.stringify(likedComments));
    } catch (err) {
      console.error('댓글 좋아요 실패:', err);
      if (err instanceof Error) {
        setAlertModal({ isOpen: true, message: err.message || '좋아요에 실패했습니다.', type: 'error' });
      }
    } finally {
      setLiking(false);
    }
  };

  const replies = allComments ? allComments.filter(c => c.parentId === comment.id) : [];

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || submitting) return;

    const token = tokenUtils.getAccessToken();
    if (!token) {
      setAlertModal({ 
        isOpen: true, 
        message: '로그인이 필요합니다.', 
        type: 'warning',
        onClose: () => {
          setAlertModal({ isOpen: false, message: '', type: 'info' });
          window.location.href = '/login';
        }
      });
      return;
    }

    setSubmitting(true);
    try {
      await commentsApi.create(articleId, {
        content: replyContent.trim(),
        parentId: comment.id,
      });
      setReplyContent('');
      setShowReplyForm(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('대댓글 작성 실패:', err);
      if (err instanceof Error) {
        setAlertModal({ isOpen: true, message: err.message || '대댓글 작성에 실패했습니다.', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="comment-item" style={{ marginLeft: `${comment.depth * 2}rem` }}>
        <div className="comment-header">
          <span className="comment-author">{comment.authorName || '익명'}</span>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
        </div>
        {comment.deleted ? (
          <div className="comment-content deleted">삭제된 댓글입니다.</div>
        ) : (
          <>
            <div className="comment-content">{comment.content}</div>
            <div className="comment-actions">
              <button
                className={`comment-like-btn ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={liking}
                title={liked ? '좋아요 취소' : '좋아요'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>{likeCount}</span>
              </button>
              <button
                className="comment-reply-btn"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                답글
              </button>
              {replies.length > 0 && (
                <button
                  className="comment-show-replies-btn"
                  onClick={() => setShowRepliesState(!showRepliesState)}
                >
                  {showRepliesState ? '답글 숨기기' : `답글 ${replies.length}개 보기`}
                </button>
              )}
            </div>
            {showReplyForm && (
              <form className="comment-reply-form" onSubmit={handleReplySubmit}>
                <textarea
                  className="comment-reply-input"
                  placeholder="답글을 입력하세요..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  disabled={submitting}
                />
                <div className="comment-reply-actions">
                  <button
                    type="button"
                    className="comment-cancel-btn"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                    disabled={submitting}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="comment-submit-btn"
                    disabled={!replyContent.trim() || submitting}
                  >
                    {submitting ? '등록 중...' : '등록'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {showRepliesState && replies.length > 0 && (
        <div className="comment-replies">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              articleId={articleId}
              onRefresh={onRefresh}
              allComments={allComments}
              showReplies={false}
            />
          ))}
        </div>
      )}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => {
          if (alertModal.onClose) {
            alertModal.onClose();
          } else {
            setAlertModal({ isOpen: false, message: '', type: 'info' });
          }
        }}
        message={alertModal.message}
        type={alertModal.type}
      />
    </>
  );
}

export default CommentItem;
