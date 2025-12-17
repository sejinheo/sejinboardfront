import { apiClient } from './client';
import type {
  CommentResponse,
  CommentCreateRequest,
  CommentUpdateRequest,
} from '../../types/api';

export const commentsApi = {
  
  create: async (
    articleId: number,
    data: CommentCreateRequest
  ): Promise<CommentResponse> => {
    return apiClient.post<CommentResponse>(
      `/api/articles/${articleId}/comments`,
      data
    );
  },

  getList: async (articleId: number): Promise<CommentResponse[]> => {
    return apiClient.get<CommentResponse[]>(
      `/api/articles/${articleId}/comments`
    );
  },

  update: async (
    articleId: number,
    commentId: number,
    data: CommentUpdateRequest
  ): Promise<CommentResponse> => {
    return apiClient.put<CommentResponse>(
      `/api/articles/${articleId}/comments/${commentId}`,
      data
    );
  },

  delete: async (articleId: number, commentId: number): Promise<void> => {
    await apiClient.delete<void>(
      `/api/articles/${articleId}/comments/${commentId}`
    );
  },
};

