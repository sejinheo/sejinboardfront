import '../styles/ArticleCard.css';

function ArticleCard({ article }) {
  const formatDate = (date) => {
    const now = new Date();
    const articleDate = new Date(date);
    const diffTime = Math.abs(now - articleDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return articleDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleClick = () => {
    window.location.href = `/article/${article.id}`;
  };

  return (
    <article className="article-card" onClick={handleClick}>
      <div className="article-image">
        {article.image && article.image.trim() ? (
          <img src={article.image} alt={article.title} onError={(e) => {
            console.error('썸네일 이미지 로드 실패:', article.image);
            e.target.style.display = 'none';
          }} />
        ) : (
          <div className="article-image-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
        )}
      </div>
      <div className="article-content">
        {article.category && (
          <div className="article-category">{article.category}</div>
        )}
        <h3 className="article-title">{article.title}</h3>
        {article.snippet && article.snippet.trim() && (
          <p className="article-snippet">{article.snippet}</p>
        )}
        <div className="article-meta">
          <span className="article-date">{formatDate(article.date)}</span>
          {article.comments > 0 && (
            <span className="article-comments">{article.comments}개의 댓글</span>
          )}
        </div>
        <div className="article-footer">
          <div className="article-author">
            <span className="author-prefix">by</span>
            <span className="author-name">{article.author || '익명'}</span>
          </div>
          <div className="article-likes">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>{article.likes}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;
