export interface ArticleResponse {
  id: number;
  title: string;
  content: string;
  authorName: string;
  viewCount: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleOwnershipResponse {
  isOwner: boolean;
}

export interface ArticleListResponse {
  id: number;
  title: string;
  authorName: string;
  viewCount: number;
  thumbnailUrl?: string;
  content: string;
  createdAt: string;
}

export interface ArticleCursorResponse {
  articles: ArticleListResponse[];
  nextCursor: number | null;
  hasNext: boolean;
}

export interface CommentResponse {
  id: number;
  content: string | null;
  authorName: string;
  authorEmail?: string;
  authorId?: number;
  isMine?: boolean;
  mine?: boolean;
  canDelete?: boolean;
  articleId: number;
  parentId: number | null;
  path: string;
  depth: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface TagResponse {
  id: number;
  name: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  gender: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  name?: string;
  email?: string;
  id?: number;
}

export interface ArticleCreateRequest {
  title: string;
  content: string;
  thumbnailUrl?: string;
}

export interface ArticleUpdateRequest {
  title: string;
  content: string;
  thumbnailUrl?: string;
}

export interface TagUpdateRequest {
  tags: string[];
}

export interface CommentCreateRequest {
  content: string;
  parentId?: number;
}

export interface CommentUpdateRequest {
  content: string;
}

export interface CursorPaginationParams {
  lastId?: number;
  size?: number;
}

export interface SearchParams extends CursorPaginationParams {
  query: string;
}

export interface TagSearchParams {
  query: string;
  size?: number;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
