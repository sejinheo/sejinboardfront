import { apiClient } from './client';
import type { LikeResponse } from '../../types/api';

export const likesApi = {
  
  toggleArticleLike: async (articleId: number): Promise<LikeResponse> => {
    return apiClient.post<LikeResponse>(`/api/articles/${articleId}/like`);
  },

  toggleCommentLike: async (commentId: number): Promise<LikeResponse> => {
    return apiClient.post<LikeResponse>(`/api/comments/${commentId}/like`);
  },

  getArticleLikeCount: async (articleId: number): Promise<number> => {
    return apiClient.get<number>(`/api/articles/${articleId}/like/count`);
  },

  getCommentLikeCount: async (commentId: number): Promise<number> => {
    return apiClient.get<number>(`/api/comments/${commentId}/like/count`);
  },
};

