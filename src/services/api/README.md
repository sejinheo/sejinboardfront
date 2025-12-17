# API 서비스 가이드

## 개요

이 프로젝트는 백엔드 API와 통신하기 위한 서비스 레이어를 제공합니다.

## 설정

환경 변수 파일 (`.env`)에 API 베이스 URL을 설정하세요:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 인증

### 토큰 관리

- **Access Token**: `localStorage`에 저장
- **Refresh Token**: `Cookie`에 저장 (httpOnly는 서버에서 설정)

### 자동 토큰 갱신

API 클라이언트는 401 에러 발생 시 자동으로 refresh token을 사용하여 access token을 갱신합니다.

## 사용 예제

### 1. 인증 (Auth)

```typescript
import { useAuth } from '../modules/auth';

function LoginPage() {
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' });
      // 로그인 성공
    } catch (err) {
      // 에러 처리
    }
  };

  return (
    <button onClick={handleLogin} disabled={loading}>
      로그인
    </button>
  );
}
```

### 2. 게시글 목록

```typescript
import { useArticles } from '../modules/home/hooks/useArticles';

function ArticleList() {
  const { articles, loading, hasNext, loadMore } = useArticles(20);

  return (
    <div>
      {articles.map(article => (
        <div key={article.id}>{article.title}</div>
      ))}
      {hasNext && <button onClick={loadMore}>더 보기</button>}
    </div>
  );
}
```

### 3. 게시글 검색

```typescript
import { useArticleSearch } from '../modules/home/hooks/useArticleSearch';

function SearchPage() {
  const { articles, search, loading } = useArticleSearch();

  const handleSearch = async (query: string) => {
    await search(query);
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {articles.map(article => (
        <div key={article.id}>{article.title}</div>
      ))}
    </div>
  );
}
```

### 4. 직접 API 호출

```typescript
import { articlesApi } from '../services/api';

// 게시글 생성
const article = await articlesApi.create({
  title: '제목',
  content: '내용',
});

// 게시글 조회
const article = await articlesApi.getById(1);

// 게시글 수정
const updated = await articlesApi.update(1, {
  title: '수정된 제목',
  content: '수정된 내용',
});

// 게시글 삭제
await articlesApi.delete(1);
```

## API 서비스 목록

### Auth API (`authApi`)
- `register(data: RegisterRequest)`: 회원가입
- `login(data: LoginRequest)`: 로그인
- `refresh()`: 토큰 갱신
- `logout()`: 로그아웃

### Articles API (`articlesApi`)
- `create(data: ArticleCreateRequest)`: 게시글 생성
- `getById(articleId: number)`: 게시글 조회
- `getList(params?: CursorPaginationParams)`: 게시글 목록
- `search(params: SearchParams)`: 게시글 검색
- `update(articleId: number, data: ArticleUpdateRequest)`: 게시글 수정
- `delete(articleId: number)`: 게시글 삭제

### Tags API (`tagsApi`)
- `updateArticleTags(articleId: number, data: TagUpdateRequest)`: 태그 수정
- `getArticleTags(articleId: number)`: 태그 조회
- `search(params: TagSearchParams)`: 태그 검색

### Comments API (`commentsApi`)
- `create(articleId: number, data: CommentCreateRequest)`: 댓글 생성
- `getList(articleId: number)`: 댓글 목록
- `update(articleId: number, commentId: number, data: CommentUpdateRequest)`: 댓글 수정
- `delete(articleId: number, commentId: number)`: 댓글 삭제

### Likes API (`likesApi`)
- `toggleArticleLike(articleId: number)`: 게시글 좋아요 토글
- `toggleCommentLike(commentId: number)`: 댓글 좋아요 토글
- `getArticleLikeCount(articleId: number)`: 게시글 좋아요 수
- `getCommentLikeCount(commentId: number)`: 댓글 좋아요 수

## 타입 정의

모든 API 요청/응답 타입은 `src/types/api.ts`에 정의되어 있습니다.

## 에러 처리

API 호출 실패 시 `Error` 객체가 throw됩니다. 에러 메시지는 서버에서 반환한 `ErrorResponse`의 `message` 필드를 사용합니다.

```typescript
try {
  await articlesApi.create({ title: '제목', content: '내용' });
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```


