import { useState, useEffect } from 'react';
import { articlesApi } from '../../../services/api';
import type { ArticleResponse } from '../../../types/api';

interface UseArticleReturn {
  article: ArticleResponse | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useArticle(articleId: number): UseArticleReturn {
  const [article, setArticle] = useState<ArticleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const loadArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await articlesApi.getById(articleId);
      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load article'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  return {
    article,
    loading,
    error,
    refresh: loadArticle,
  };
}
