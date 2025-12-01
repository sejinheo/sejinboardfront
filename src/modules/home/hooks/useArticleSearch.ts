import { useState, useCallback } from 'react';
import { articlesApi } from '../../../services/api';
import type { ArticleListResponse, ArticleCursorResponse } from '../../../types/api';

interface UseArticleSearchReturn {
  articles: ArticleListResponse[];
  loading: boolean;
  error: Error | null;
  hasNext: boolean;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  clear: () => void;
}

export function useArticleSearch(size: number = 20): UseArticleSearchReturn {
  const [articles, setArticles] = useState<ArticleListResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setArticles([]);
      setNextCursor(null);
      setHasNext(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentQuery(query);
    
    try {
      const response: ArticleCursorResponse = await articlesApi.search({
        query,
        size,
      });
      
      setArticles(response.articles);
      setNextCursor(response.nextCursor);
      setHasNext(response.hasNext);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search articles'));
    } finally {
      setLoading(false);
    }
  }, [size]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loading || !nextCursor || !currentQuery) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response: ArticleCursorResponse = await articlesApi.search({
        query: currentQuery,
        lastId: nextCursor,
        size,
      });
      
      setArticles((prev) => [...prev, ...response.articles]);
      setNextCursor(response.nextCursor);
      setHasNext(response.hasNext);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more articles'));
    } finally {
      setLoading(false);
    }
  }, [hasNext, loading, nextCursor, currentQuery, size]);

  const clear = useCallback(() => {
    setArticles([]);
    setNextCursor(null);
    setHasNext(false);
    setCurrentQuery('');
    setError(null);
  }, []);

  return {
    articles,
    loading,
    error,
    hasNext,
    search,
    loadMore,
    clear,
  };
}
