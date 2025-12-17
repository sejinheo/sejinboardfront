import { apiClient } from './client';
import type {
  ArticleResponse,
  ArticleCursorResponse,
  ArticleListResponse,
  ArticleCreateRequest,
  ArticleUpdateRequest,
  CursorPaginationParams,
  SearchParams,
  ArticleOwnershipResponse,
} from '../../types/api';

export const articlesApi = {
  
  create: async (data: ArticleCreateRequest): Promise<ArticleResponse> => {
    return apiClient.post<ArticleResponse>('/api/articles', data);
  },

  getById: async (articleId: number): Promise<ArticleResponse> => {
    return apiClient.get<ArticleResponse>(`/api/articles/${articleId}`);
  },

  getList: async (params?: CursorPaginationParams): Promise<ArticleCursorResponse> => {
    return apiClient.get<ArticleCursorResponse>('/api/articles', {
      lastId: params?.lastId,
      size: params?.size || 20,
    });
  },

  search: async (params: SearchParams): Promise<ArticleCursorResponse> => {
    return apiClient.get<ArticleCursorResponse>('/api/articles/search', {
      query: params.query,
      lastId: params.lastId,
      size: params.size || 20,
    });
  },

  getTopLiked: async (size: number = 20): Promise<ArticleListResponse[]> => {
    return apiClient.get<ArticleListResponse[]>('/api/articles/top-liked', {
      size,
    });
  },

  getTopViewed: async (page: number = 0, size: number = 20): Promise<ArticleListResponse[]> => {
    return apiClient.get<ArticleListResponse[]>('/api/articles/top-viewed', {
      page,
      size,
    });
  },

  getMyArticles: async (params?: CursorPaginationParams): Promise<ArticleCursorResponse> => {
    return apiClient.get<ArticleCursorResponse>('/api/articles/me', {
      lastId: params?.lastId,
      size: params?.size || 20,
    });
  },

  getMyLikedArticles: async (params?: CursorPaginationParams): Promise<ArticleCursorResponse> => {
    return apiClient.get<ArticleCursorResponse>('/api/articles/me/liked', {
      lastId: params?.lastId,
      size: params?.size || 20,
    });
  },

  update: async (
    articleId: number,
    data: ArticleUpdateRequest
  ): Promise<ArticleResponse> => {
    return apiClient.put<ArticleResponse>(`/api/articles/${articleId}`, data);
  },

  delete: async (articleId: number): Promise<void> => {
    await apiClient.delete<void>(`/api/articles/${articleId}`);
  },

  getOwnership: async (articleId: number): Promise<ArticleOwnershipResponse> => {
    return apiClient.get<ArticleOwnershipResponse>(`/api/articles/${articleId}/ownership`);
  },
};
