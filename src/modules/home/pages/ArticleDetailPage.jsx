import { useEffect, useState } from 'react';
import { useArticle } from '../hooks/useArticle';
import { tagsApi } from '../../../services/api/tags';
import { commentsApi } from '../../../services/api/comments';
import { likesApi } from '../../../services/api/likes';
import { articlesApi } from '../../../services/api/articles';
import { tokenUtils } from '../../../utils/token';
import { parseMarkdown } from '../../../utils/markdown';
import Header from '../components/Header';
import CommentItem from '../components/CommentItem';
import AlertModal from '../../../components/AlertModal';
import ConfirmModal from '../../../components/ConfirmModal';
import '../styles/ArticleDetailPage.css';

function ArticleDetailPage() {

  const path = window.location.pathname;
  const articleIdMatch = path.match(/^\/article\/(\d+)$/);
  const articleId = articleIdMatch ? parseInt(articleIdMatch[1], 10) : null;

  const { article, loading, error, refresh } = useArticle(articleId || 0);
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!articleId) return;
      
      const token = tokenUtils.getAccessToken();
      if (!token) {

        setLiked(false);
        return;
      }

      try {
        const userName = localStorage.getItem('userName');
        if (!userName) {

          setLiked(false);
          return;
        }

        const likedArticlesKey = `likedArticles_${userName}`;
        const likedArticles = JSON.parse(localStorage.getItem(likedArticlesKey) || '[]');
        const isLiked = likedArticles.includes(articleId);
        console.log('💾 localStorage에서 좋아요 상태 확인:', { articleId, userName, isLiked });
        setLiked(isLiked);
      } catch (err) {
        console.error('좋아요 상태 확인 실패:', err);
        setLiked(false);
      }
    };

    checkLikeStatus();
  }, [articleId]);

  useEffect(() => {
    if (articleId) {
      setTagsLoading(true);
      tagsApi.getArticleTags(articleId)
        .then((tagList) => {
          setTags(tagList.map(tag => tag.name));
        })
        .catch((err) => {
          console.error('태그 로딩 실패:', err);
        })
        .finally(() => {
          setTagsLoading(false);
        });
    }
  }, [articleId]);

  useEffect(() => {
    if (articleId) {
      loadComments();
    }
  }, [articleId]);

  const loadComments = async () => {
    if (!articleId) return;
    setCommentsLoading(true);
    try {
      console.log('💬 댓글 로딩 시작...', articleId);
      const commentList = await commentsApi.getList(articleId);
      console.log('✅ 댓글 로딩 성공:', commentList);
      setComments(commentList);
    } catch (err) {
      console.error('❌ 댓글 로딩 실패:', err);
      if (err instanceof Error) {
        console.error('   에러 메시지:', err.message);
        console.error('   에러 스택:', err.stack);
      }
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!articleId || liking) return;
    
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
      console.log('❤️ 좋아요 토글 시작...', articleId);
      console.log('   현재 liked 상태:', liked);
      const response = await likesApi.toggleArticleLike(articleId);
      console.log('✅ 좋아요 토글 성공:', response);
      console.log('   response.liked:', response.liked);
      console.log('   response.liked 타입:', typeof response.liked);
      
      const newLikedState = response.liked === true || response.liked === 'true';
      console.log('   새로운 liked 상태:', newLikedState);
      setLiked(newLikedState);
      
      const userName = localStorage.getItem('userName');
      if (!userName) {
        console.warn('⚠️ 사용자 이름이 없어 좋아요 상태를 저장할 수 없습니다.');
      } else {
        const likedArticlesKey = `likedArticles_${userName}`;
        const likedArticles = JSON.parse(localStorage.getItem(likedArticlesKey) || '[]');
        
        if (newLikedState) {

          if (!likedArticles.includes(articleId)) {
            likedArticles.push(articleId);
          }
        } else {

          const index = likedArticles.indexOf(articleId);
          if (index > -1) {
            likedArticles.splice(index, 1);
          }
        }
        localStorage.setItem(likedArticlesKey, JSON.stringify(likedArticles));
        console.log('💾 좋아요 상태 저장:', { userName, articleId, liked: newLikedState });
      }
      
      const likeUpdateKey = `like_updated_${articleId}`;
      localStorage.setItem(likeUpdateKey, Date.now().toString());
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: likeUpdateKey,
        newValue: Date.now().toString(),
      }));
    } catch (err) {
      console.error('❌ 좋아요 실패:', err);
      if (err instanceof Error) {
        console.error('   에러 메시지:', err.message);
        console.error('   에러 스택:', err.stack);
        setAlertModal({ isOpen: true, message: err.message || '좋아요에 실패했습니다.', type: 'error' });
      }
    } finally {
      setLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!articleId || !commentContent.trim() || submittingComment) return;

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

    setSubmittingComment(true);
    try {
      const requestData = {
        content: commentContent.trim(),
      };

      console.log('💬 댓글 작성 시작...', { 
        articleId, 
        content: requestData.content,
        requestData 
      });
      console.log('📤 요청 데이터:', JSON.stringify(requestData, null, 2));
      
      const response = await commentsApi.create(articleId, requestData);
      console.log('✅ 댓글 작성 성공:', response);
      setCommentContent('');
      await loadComments();
    } catch (err) {
      console.error('❌ 댓글 작성 실패:', err);
      if (err instanceof Error) {
        console.error('   에러 메시지:', err.message);
        console.error('   에러 스택:', err.stack);
        
        if (err.message.includes('401') || err.message.includes('인증')) {
          setAlertModal({ 
            isOpen: true, 
            message: '로그인이 필요합니다. 다시 로그인해주세요.', 
            type: 'warning',
            onClose: () => {
              setAlertModal({ isOpen: false, message: '', type: 'info' });
              window.location.href = '/login';
            }
          });
        } else if (err.message.includes('400') || err.message.includes('Bad Request')) {
          setAlertModal({ isOpen: true, message: '댓글 내용을 확인해주세요. ' + err.message, type: 'error' });
        } else {
          setAlertModal({ isOpen: true, message: '댓글 작성에 실패했습니다: ' + err.message, type: 'error' });
        }
      } else {
        setAlertModal({ isOpen: true, message: '댓글 작성에 실패했습니다.', type: 'error' });
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!articleId) return;

    try {
      const likeCount = await likesApi.getArticleLikeCount(articleId);
      console.log('💖 게시글 좋아요 수:', likeCount);
      
      if (likeCount > 0) {
        setAlertModal({
          isOpen: true,
          message: '게시글에 좋아요가 있습니다! 그 사람을 위해서 삭제하지 말아주세요ㅠㅠ',
          type: 'warning'
        });
        return;
      }
      
      setShowDeleteConfirm(true);
    } catch (err) {
      console.error('❌ 좋아요 수 확인 실패:', err);
      setShowDeleteConfirm(true);
    }
  };

  const handleDelete = async () => {
    if (!articleId || deleting) return;

    setDeleting(true);
    try {
      console.log('🗑️ 게시글 삭제 시작...', articleId);
      await articlesApi.delete(articleId);
      console.log('✅ 게시글 삭제 성공');
      
      setAlertModal({
        isOpen: true,
        message: '게시글이 삭제되었습니다.',
        type: 'success',
        onClose: () => {
          setAlertModal({ isOpen: false, message: '', type: 'info' });
          window.location.href = '/';
        }
      });
    } catch (err) {
      console.error('❌ 게시글 삭제 실패:', err);
      if (err instanceof Error) {
        console.error('   에러 메시지:', err.message);
        console.error('   에러 스택:', err.stack);
        
        if (err.message.includes('403') || err.message.includes('권한') || err.message.includes('Forbidden') || err.message.includes('서버')) {
          setAlertModal({ 
            isOpen: true, 
            message: '다른 사람의 게시글은 수정, 삭제할 수 없습니다!', 
            type: 'warning' 
          });
        } else {
          setAlertModal({ 
            isOpen: true, 
            message: err.message || '게시글 삭제에 실패했습니다.', 
            type: 'error' 
          });
        }
      } else {
        setAlertModal({ isOpen: true, message: '게시글 삭제에 실패했습니다.', type: 'error' });
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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

  if (!articleId) {
    return (
      <div className="article-detail-page">
        <Header />
        <main className="article-detail-main">
          <div className="error">잘못된 글 ID입니다.</div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="article-detail-page">
        <Header />
        <main className="article-detail-main">
          <div className="loading">로딩 중...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-detail-page">
        <Header />
        <main className="article-detail-main">
          <div className="error">
            <p>에러가 발생했습니다: {error.message}</p>
            <button onClick={() => window.location.href = '/'} className="retry-button">
              홈으로 돌아가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-detail-page">
        <Header />
        <main className="article-detail-main">
          <div className="error">글을 찾을 수 없습니다.</div>
        </main>
      </div>
    );
  }

  const sortedComments = [...comments].sort((a, b) => {
    return a.path.localeCompare(b.path);
  });

  return (
    <div className="article-detail-page">
      <Header />
      <main className="article-detail-main">
        <div className="article-detail-container">

          <div className="article-detail-sidebar">
            <button
              className={`like-button ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={liking}
              title={liked ? '좋아요 취소' : '좋아요'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>

          <div className="article-detail-content-wrapper">
            <article className="article-detail">

              <div className="article-detail-thumbnail">
                {article.thumbnailUrl && article.thumbnailUrl.trim() ? (
                  <img 
                    src={article.thumbnailUrl} 
                    alt={article.title}
                    onError={(e) => {
                      console.error('썸네일 이미지 로드 실패:', article.thumbnailUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="article-thumbnail-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                )}
              </div>

              <h1 className="article-detail-title">{article.title}</h1>

              <div className="article-detail-meta">
                <div className="article-detail-meta-row">
                  <div className="article-detail-author-info">
                    <span className="article-detail-author">{article.authorName || '익명'}</span>
                    <span className="article-detail-separator">·</span>
                    <span className="article-detail-date">{formatDate(article.createdAt)}</span>
                  </div>
                  {tokenUtils.getAccessToken() && (
                    <div className="article-action-buttons">
                      <button
                        className="article-edit-button"
                        onClick={() => {
                          window.location.href = `/edit/${articleId}`;
                        }}
                        title="글 수정"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        수정
                      </button>
                      <button
                        className="article-delete-button"
                        onClick={handleDeleteClick}
                        title="글 삭제"
                        disabled={deleting}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        {deleting ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  )}
                </div>
                {tags.length > 0 && (
                  <div className="article-detail-tags">
                    {tags.map((tag, index) => (
                      <span key={index} className="article-detail-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div 
                className="article-detail-content"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(article.content) }}
              />
            </article>

            <section className="comments-section">
              <h2 className="comments-title">댓글 {comments.length}</h2>

              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <textarea
                  className="comment-input"
                  placeholder="댓글을 입력하세요..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={4}
                  disabled={submittingComment}
                />
                <div className="comment-form-actions">
                  <button
                    type="submit"
                    className="comment-submit-button"
                    disabled={!commentContent.trim() || submittingComment}
                  >
                    {submittingComment ? '등록 중...' : '등록'}
                  </button>
                </div>
              </form>

              {commentsLoading ? (
                <div className="comments-loading">댓글을 불러오는 중...</div>
              ) : comments.length === 0 ? (
                <div className="comments-empty">아직 댓글이 없습니다.</div>
              ) : (
                <div className="comments-list">
                  {sortedComments
                    .filter(comment => !comment.parentId)
                    .map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        articleId={articleId}
                        onRefresh={loadComments}
                        allComments={sortedComments}
                        showReplies={false}
                      />
                    ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
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
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="게시글 삭제"
        message="정말 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        type="danger"
      />
    </div>
  );
}

export default ArticleDetailPage;
