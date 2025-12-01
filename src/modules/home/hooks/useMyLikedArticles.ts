import { useState, useEffect, useCallback } from 'react';
import { articlesApi } from '../../../services/api';
import type { ArticleListResponse, ArticleCursorResponse } from '../../../types/api';
import { tokenUtils } from '../../../utils/token';

interface UseMyLikedArticlesReturn {
  articles: ArticleListResponse[];
  loading: boolean;
  error: Error | null;
  hasNext: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMyLikedArticles(initialSize: number = 20): UseMyLikedArticlesReturn {
  const [articles, setArticles] = useState<ArticleListResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);

  const loadMyLikedArticles = useCallback(async (lastId?: number) => {
    setLoading(true);
    setError(null);
    try {
      console.log('❤️ 내가 좋아요한 게시글 목록 로딩 시작...', { lastId, size: initialSize });
      const response: ArticleCursorResponse = await articlesApi.getMyLikedArticles({
        lastId,
        size: initialSize,
      });
      
      console.log('✅ 내가 좋아요한 게시글 목록 로딩 성공:', response);
      console.log('   글 개수:', response.articles.length);
      console.log('   다음 커서:', response.nextCursor);
      console.log('   더 있음:', response.hasNext);
      
      if (lastId) {

        setArticles((prev) => {
          const existingIds = new Set(prev.map(a => a.id));
          const newArticles = response.articles.filter(a => !existingIds.has(a.id));
          return [...prev, ...newArticles];
        });
      } else {

        setArticles((prev) => {
          const existingIds = new Set(prev.map(a => a.id));
          const newArticles = response.articles.filter(a => !existingIds.has(a.id));
          return prev.length === 0 ? response.articles : [...prev, ...newArticles].filter((article, index, self) => 
            index === self.findIndex(a => a.id === article.id)
          );
        });
      }
      
      setNextCursor(response.nextCursor);
      setHasNext(response.hasNext);
    } catch (err) {
      console.error('❌ 내가 좋아요한 게시글 목록 로딩 실패:', err);
      if (err instanceof Error) {
        console.error('   에러 메시지:', err.message);
        console.error('   에러 스택:', err.stack);
        setError(err);
      } else {
        console.error('   알 수 없는 에러:', err);
        setError(new Error('내가 좋아요한 게시글 목록을 불러오는데 실패했습니다.'));
      }
    } finally {
      setLoading(false);
    }
  }, [initialSize]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loading || !nextCursor) return;
    await loadMyLikedArticles(nextCursor);
  }, [hasNext, loading, nextCursor, loadMyLikedArticles]);

  const refresh = useCallback(async () => {
    setNextCursor(null);
    setHasNext(false);
    await loadMyLikedArticles();
  }, [loadMyLikedArticles]);

  useEffect(() => {

    if (tokenUtils.getAccessToken()) {
      loadMyLikedArticles();
    } else {

      setArticles([]);
      setNextCursor(null);
      setHasNext(false);
      setError(new Error('내가 좋아요한 게시글을 보려면 로그인해야 합니다.'));
    }

  }, [tokenUtils.getAccessToken(), loadMyLikedArticles]);

  return {
    articles,
    loading,
    error,
    hasNext,
    loadMore,
    refresh,
  };
}
