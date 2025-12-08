export const API_ENDPOINTS = {

  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',

  ARTICLES: '/api/articles',
  ARTICLE_BY_ID: (id: number) => `/api/articles/${id}`,
  ARTICLE_SEARCH: '/api/articles/search',

  ARTICLE_TAGS: (id: number) => `/api/articles/${id}/tags`,
  TAGS: '/api/tags',

  ARTICLE_COMMENTS: (id: number) => `/api/articles/${id}/comments`,
  COMMENT: (articleId: number, commentId: number) =>
    `/api/articles/${articleId}/comments/${commentId}`,

  ARTICLE_LIKE: (id: number) => `/api/articles/${id}/like`,
  ARTICLE_LIKE_COUNT: (id: number) => `/api/articles/${id}/like/count`,
  COMMENT_LIKE: (id: number) => `/api/comments/${id}/like`,
  COMMENT_LIKE_COUNT: (id: number) => `/api/comments/${id}/like/count`,
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_TAG_SEARCH_SIZE = 10;
