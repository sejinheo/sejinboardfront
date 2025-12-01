import { useState, useEffect, useCallback } from 'react';
import { articlesApi } from '../../../services/api';
import type { ArticleListResponse } from '../../../types/api';

interface UseTopViewedArticlesReturn {
  articles: ArticleListResponse[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useTopViewedArticles(size: number = 20): UseTopViewedArticlesReturn {
  const [articles, setArticles] = useState<ArticleListResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const loadTopViewedArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('👁️ 조회수 순 게시글 로딩 시작...', { size });
      const response: ArticleListResponse[] = await articlesApi.getTopViewed(0, size);
      
      console.log('✅ 조회수 순 게시글 로딩 성공:', response);
      console.log('   글 개수:', response.length);
      
      setArticles(response);
    } catch (err) {
      console.error('❌ 조회수 순 게시글 로딩 실패:', err);
      if (err instanceof Error) {
        console.error('   에러 메시지:', err.message);
        console.error('   에러 스택:', err.stack);
        setError(err);
      } else {
        console.error('   알 수 없는 에러:', err);
        setError(new Error('조회수 순 게시글 목록을 불러오는데 실패했습니다.'));
      }
    } finally {
      setLoading(false);
    }
  }, [size]);

  const refresh = useCallback(async () => {
    await loadTopViewedArticles();
  }, [loadTopViewedArticles]);

  useEffect(() => {
    loadTopViewedArticles();

  }, []);

  return {
    articles,
    loading,
    error,
    refresh,
  };
}
