import { apiClient } from './client';
import type {
  TagResponse,
  TagUpdateRequest,
  TagSearchParams,
} from '../../types/api';

export const tagsApi = {
  
  updateArticleTags: async (
    articleId: number,
    data: TagUpdateRequest
  ): Promise<TagResponse[]> => {
    return apiClient.put<TagResponse[]>(`/api/articles/${articleId}/tags`, data);
  },

  getArticleTags: async (articleId: number): Promise<TagResponse[]> => {
    return apiClient.get<TagResponse[]>(`/api/articles/${articleId}/tags`);
  },

  search: async (params: TagSearchParams): Promise<TagResponse[]> => {
    return apiClient.get<TagResponse[]>('/api/tags', {
      query: params.query,
      size: params.size || 10,
    });
  },
};
