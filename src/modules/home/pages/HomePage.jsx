import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import FilterNav from '../components/FilterNav';
import ArticleCard from '../components/ArticleCard';
import { useArticles } from '../hooks/useArticles';
import { useArticleSearch } from '../hooks/useArticleSearch';
import { useTopLikedArticles } from '../hooks/useTopLikedArticles';
import { useTopViewedArticles } from '../hooks/useTopViewedArticles';
import { useMyArticles } from '../hooks/useMyArticles';
import { useMyLikedArticles } from '../hooks/useMyLikedArticles';
import { likesApi } from '../../../services/api/likes';
import { tokenUtils } from '../../../utils/token';
import '../styles/HomePage.css';

function HomePage() {
  const { articles: normalArticles, loading: normalLoading, error: normalError, hasNext: normalHasNext, loadMore: normalLoadMore, refresh: refreshNormal } = useArticles(20);
  const { articles: searchArticles, loading: searchLoading, error: searchError, hasNext: searchHasNext, loadMore: searchLoadMore, search, clear: clearSearch } = useArticleSearch(20);
  const { articles: topLikedArticles, loading: topLikedLoading, error: topLikedError, refresh: refreshTopLiked } = useTopLikedArticles(20);
  const { articles: topViewedArticles, loading: topViewedLoading, error: topViewedError, refresh: refreshTopViewed } = useTopViewedArticles(20);
  const { articles: myArticles, loading: myArticlesLoading, error: myArticlesError, hasNext: myArticlesHasNext, loadMore: myArticlesLoadMore, refresh: refreshMyArticles } = useMyArticles(20);

  const { articles: myLikedArticles, loading: myLikedLoading, error: myLikedError, hasNext: myLikedHasNext, loadMore: myLikedLoadMore, refresh: refreshMyLiked } = tokenUtils.getAccessToken() ? useMyLikedArticles(20) : { articles: [], loading: false, error: null, hasNext: false, loadMore: () => Promise.resolve(), refresh: () => Promise.resolve() };
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showMyArticles, setShowMyArticles] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('트렌딩');

  const isSearchMode = searchQuery.trim().length > 0;
  
  const isTrendingMode = activeFilter === '트렌딩' && !isSearchMode && !showMyArticles;
  const isRecommendedMode = activeFilter === '추천' && !isSearchMode && !showMyArticles;
  const isFeedMode = activeFilter === '피드' && !isSearchMode && !showMyArticles;
  
  const articles = isSearchMode 
    ? searchArticles 
    : showMyArticles
      ? myArticles
      : isTrendingMode 
        ? topViewedArticles
        : isRecommendedMode
          ? topLikedArticles
          : isFeedMode
            ? myLikedArticles
            : normalArticles;
  const loading = isSearchMode 
    ? searchLoading 
    : showMyArticles
      ? myArticlesLoading
      : isTrendingMode 
        ? topViewedLoading 
        : isRecommendedMode
          ? topLikedLoading
          : isFeedMode
            ? myLikedLoading
            : normalLoading;
  const error = isSearchMode 
    ? searchError 
    : showMyArticles
      ? myArticlesError
      : isTrendingMode 
        ? topViewedError 
        : isRecommendedMode
          ? topLikedError
          : isFeedMode
            ? myLikedError
            : normalError;
  const hasNext = isSearchMode 
    ? searchHasNext 
    : showMyArticles
      ? myArticlesHasNext
      : isTrendingMode
        ? false
        : isRecommendedMode
          ? false
          : isFeedMode
            ? myLikedHasNext
            : normalHasNext;
  
  const loadMore = useCallback(async () => {
    if (isSearchMode) {
      if (isLoadingMore || !searchHasNext) return;
      setIsLoadingMore(true);
      try {
        await searchLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    } else if (showMyArticles) {

      if (isLoadingMore || !myArticlesHasNext) return;
      setIsLoadingMore(true);
      try {
        await myArticlesLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    } else if (isFeedMode) {

      if (isLoadingMore || !myLikedHasNext) return;
      setIsLoadingMore(true);
      try {
        await myLikedLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    } else if (!isTrendingMode && !isRecommendedMode) {

      if (isLoadingMore || !normalHasNext) return;
      setIsLoadingMore(true);
      try {
        await normalLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [isSearchMode, showMyArticles, isTrendingMode, isRecommendedMode, isFeedMode, isLoadingMore, searchHasNext, myArticlesHasNext, myLikedHasNext, normalHasNext, searchLoadMore, myArticlesLoadMore, myLikedLoadMore, normalLoadMore]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.trim()) {
      search(query.trim());
    } else {
      clearSearch();
    }
  }, [search, clearSearch]);

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {

        console.log('🔄 페이지 포커스 복귀, 글 목록 새로고침');
        if (showMyArticles) {
          refreshMyArticles();
        } else if (isTrendingMode) {
          refreshTopViewed();
        } else if (isRecommendedMode) {
          refreshTopLiked();
        } else if (isFeedMode) {
          refreshMyLiked();
        } else if (!isSearchMode) {
          refreshNormal();
        }
      }
    };

    const handleStorageChange = (e) => {

      if (e.key && e.key.startsWith('like_updated_')) {
        console.log('❤️ 좋아요 업데이트 감지, 글 목록 새로고침');
        if (showMyArticles) {
          refreshMyArticles();
        } else if (isTrendingMode) {
          refreshTopViewed();
        } else if (isRecommendedMode) {
          refreshTopLiked();
        } else if (isFeedMode) {
          refreshMyLiked();
        } else if (!isSearchMode) {
          refreshNormal();
        }
      }

      if (e.key === 'userName' || e.key === null) {
        setCurrentUserName(localStorage.getItem('userName'));
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [showMyArticles, isTrendingMode, isRecommendedMode, isFeedMode, isSearchMode, refreshMyArticles, refreshTopViewed, refreshTopLiked, refreshMyLiked, refreshNormal]);

  const [articleLikes, setArticleLikes] = useState({});

  useEffect(() => {

    const urlParams = new URLSearchParams(window.location.search);
    const myArticles = urlParams.get('myArticles');
    const shouldShowMyArticles = myArticles === 'true';
    setShowMyArticles(shouldShowMyArticles);

    if (shouldShowMyArticles && tokenUtils.getAccessToken()) {
      console.log('📝 내 게시글 조회 모드 - API 호출');
      refreshMyArticles();
    }

    const userName = localStorage.getItem('userName');
    if (userName) {
      setCurrentUserName(userName);
    } else if (articles.length > 0 && tokenUtils.getAccessToken()) {

      const firstArticle = articles[0];
      if (firstArticle && firstArticle.authorName) {
        setCurrentUserName(firstArticle.authorName);
        localStorage.setItem('userName', firstArticle.authorName);
      }
    }
  }, [articles, refreshMyArticles]);

  useEffect(() => {
    const loadLikes = async () => {
      const likesMap = {};
      const promises = articles.map(async (article) => {
        try {
          const count = await likesApi.getArticleLikeCount(article.id);
          likesMap[article.id] = count;
        } catch (err) {
          console.error(`좋아요 수 로딩 실패 (글 ID: ${article.id}):`, err);
          likesMap[article.id] = 0;
        }
      });
      await Promise.all(promises);
      setArticleLikes(likesMap);
    };

    if (articles.length > 0) {
      loadLikes();
    }
  }, [articles]);

  const extractTextFromMarkdown = (markdown) => {
    if (!markdown) return '';

    return markdown
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '') // 인라인 코드 제거
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/>\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();
  };

  const transformArticle = (article) => {
    console.log('📝 Article 변환:', article);
    console.log('   authorName:', article.authorName);
    console.log('   thumbnailUrl:', article.thumbnailUrl);
    console.log('   content:', article.content);
    
    let snippet = '';
    if (article.content) {
      snippet = extractTextFromMarkdown(article.content);

      if (snippet.length > 150) {
        snippet = snippet.substring(0, 150) + '...';
      }
    } else {

      snippet = '';
    }
    
    const transformed = {
      id: article.id,
      title: article.title,
      snippet: snippet,
      author: article.authorName || '익명',
      date: new Date(article.createdAt),
      likes: articleLikes[article.id] ?? 0,
      comments: 0,
      viewCount: article.viewCount,
      image: article.thumbnailUrl || null,
    };
    console.log('   변환된 snippet:', transformed.snippet);
    console.log('   변환된 image:', transformed.image);
    return transformed;
  };

  if (loading && articles.length === 0) {
    return (
      <div className="home-page">
        <Header onSearch={handleSearch} searchQuery={searchQuery} />
        {!isSearchMode && <FilterNav showMyArticles={showMyArticles} activeFilter={activeFilter} onFilterChange={handleFilterChange} />}
        <main className="main-content">
          <div className="loading">로딩 중...</div>
        </main>
      </div>
    );
  }

  if (error) {

    const isAuthError = error.message.includes('로그인') || 
                       error.message.includes('인증') || 
                       error.message.includes('토큰') || 
                       error.message.includes('401') || 
                       error.message.includes('Unauthorized') ||
                       (showMyArticles && !tokenUtils.getAccessToken()) ||
                       (isFeedMode && !tokenUtils.getAccessToken());
    
    if (isAuthError) {

      localStorage.removeItem('accessToken');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      return (
        <div className="home-page">
          <Header onSearch={handleSearch} searchQuery={searchQuery} />
          {!isSearchMode && <FilterNav showMyArticles={showMyArticles} activeFilter={activeFilter} onFilterChange={handleFilterChange} />}
          <main className="main-content">
            <div className="error">
              <p>{(showMyArticles || isFeedMode) ? '로그인이 필요합니다.' : error.message}</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>로그인 페이지로 이동합니다...</p>
            </div>
          </main>
        </div>
      );
    }

    const errorMessage = (showMyArticles || isFeedMode) && !tokenUtils.getAccessToken()
      ? '로그인이 필요합니다. 로그인 후 다시 시도해주세요.'
      : error.message;

    return (
      <div className="home-page">
        <Header onSearch={handleSearch} searchQuery={searchQuery} />
        {!isSearchMode && <FilterNav showMyArticles={showMyArticles} activeFilter={activeFilter} onFilterChange={handleFilterChange} />}
        <main className="main-content">
          <div className="error">
            <p>에러가 발생했습니다: {errorMessage}</p>
            <button
              onClick={() => {
                if (showMyArticles) {
                  refreshMyArticles();
                } else if (isFeedMode) {
                  refreshMyLiked();
                } else {
                  window.location.reload();
                }
              }}
              className="retry-button"
            >
              다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />
      {!isSearchMode && <FilterNav showMyArticles={showMyArticles} activeFilter={activeFilter} onFilterChange={handleFilterChange} />}
      <main className="main-content">
        {isSearchMode && (
          <div className="search-results-header">
            <h2>검색 결과: "{searchQuery}"</h2>
            <p className="search-results-count">{articles.length}개의 결과</p>
          </div>
        )}
        {isFeedMode && !tokenUtils.getAccessToken() ? (
          <div className="empty-state">
            <p>내가 좋아요한 게시글을 보려면 로그인해야 합니다.</p>
            <button onClick={() => window.location.href = '/login'} className="login-redirect-button">
              로그인
            </button>
          </div>
        ) : (
          <>
            <div className={`articles-grid ${showMyArticles ? 'my-articles-layout' : ''}`}>
              {articles.length === 0 && !loading ? (
                <div className="empty-state">
                  <p>
                    {isSearchMode 
                      ? '검색 결과가 없습니다.' 
                      : showMyArticles 
                        ? '작성한 글이 없습니다.' 
                        : isFeedMode
                          ? '좋아요한 글이 없습니다.'
                          : '글이 없습니다.'}
                  </p>
                </div>
              ) : (
                articles
                  .filter((article, index, self) => {

                    const isUnique = index === self.findIndex(a => a.id === article.id);
                    return isUnique;
                  })
                  .map((article) => (
                    <ArticleCard key={article.id} article={transformArticle(article)} />
                  ))
              )}
            </div>
            {hasNext && !isTrendingMode && !isRecommendedMode && (
              <div className="load-more-container">
                <button
                  className="load-more-button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? '로딩 중...' : '더 보기'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default HomePage;
