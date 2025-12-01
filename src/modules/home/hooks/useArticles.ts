import { useState, useEffect, useCallback } from 'react';
import { articlesApi } from '../../../services/api';
import type { ArticleListResponse, ArticleCursorResponse } from '../../../types/api';

interface UseArticlesReturn {
  articles: ArticleListResponse[];
  loading: boolean;
  error: Error | null;
  hasNext: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useArticles(initialSize: number = 20): UseArticlesReturn {
  const [articles, setArticles] = useState<ArticleListResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);

  const loadArticles = useCallback(async (lastId?: number) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📰 글 목록 로딩 시작...', { lastId, size: initialSize });
      const response: ArticleCursorResponse = await articlesApi.getList({
        lastId,
        size: initialSize,
      });
      
      console.log('✅ 글 목록 로딩 성공:', response);
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
      console.error('❌ 글 목록 로딩 실패:', err);
      if (err instanceof Error) {
        console.error('   에러 메시지:', err.message);
        console.error('   에러 스택:', err.stack);
        setError(err);
      } else {
        console.error('   알 수 없는 에러:', err);
        setError(new Error('글 목록을 불러오는데 실패했습니다.'));
      }
    } finally {
      setLoading(false);
    }
  }, [initialSize]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loading || !nextCursor) return;
    await loadArticles(nextCursor);
  }, [hasNext, loading, nextCursor, loadArticles]);

  const refresh = useCallback(async () => {
    setNextCursor(null);
    setHasNext(false);
    await loadArticles();
  }, [loadArticles]);

  useEffect(() => {

    loadArticles();

  }, []);

  return {
    articles,
    loading,
    error,
    hasNext,
    loadMore,
    refresh,
  };
}
