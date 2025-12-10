# API 구현 체크리스트 (Swagger 명세서 대조)

## ✅ Auth API

### POST /auth/register
- [x] 엔드포인트: `/auth/register`
- [x] 메서드: POST
- [x] 요청 본문: `{name, email, password, gender: boolean}`
- [x] 응답: 200 OK / 201 Created
- [x] 구현 위치: `src/services/api/auth.ts`

### POST /auth/login
- [x] 엔드포인트: `/auth/login`
- [x] 메서드: POST
- [x] 요청 본문: `{email, password}`
- [x] 응답 헤더: `Authorization: Bearer {accessToken}`, `Set-Cookie: refreshToken`
- [x] 구현 위치: `src/services/api/auth.ts`
- [x] 토큰 추출: 헤더 및 본문에서 토큰 추출 로직 구현됨

### POST /auth/refresh
- [x] 엔드포인트: `/auth/refresh`
- [x] 메서드: POST
- [x] Cookie: refreshToken 사용
- [x] 응답 헤더: `Authorization: Bearer {accessToken}`
- [x] 구현 위치: `src/services/api/auth.ts`

### POST /auth/logout
- [x] 엔드포인트: `/auth/logout`
- [x] 메서드: POST
- [x] JWT 인증 필요
- [x] Cookie refreshToken 삭제
- [x] 구현 위치: `src/services/api/auth.ts`

---

## ✅ Articles API

### POST /api/articles
- [x] 엔드포인트: `/api/articles`
- [x] 메서드: POST
- [x] JWT 인증 필요
- [x] 요청 본문: `{title, content}`
- [x] 응답: `ArticleResponse`
- [x] 구현 위치: `src/services/api/articles.ts`

### GET /api/articles/{articleId}
- [x] 엔드포인트: `/api/articles/{articleId}`
- [x] 메서드: GET
- [x] 공개 엔드포인트
- [x] 응답: `ArticleResponse` (조회수 +1)
- [x] 구현 위치: `src/services/api/articles.ts`

### GET /api/articles
- [x] 엔드포인트: `/api/articles`
- [x] 메서드: GET
- [x] 쿼리 파라미터: `lastId?`, `size=20`
- [x] 응답: `ArticleCursorResponse` (커서 페이지네이션)
- [x] 구현 위치: `src/services/api/articles.ts`

### GET /api/articles/search
- [x] 엔드포인트: `/api/articles/search`
- [x] 메서드: GET
- [x] 쿼리 파라미터: `query` (required), `lastId?`, `size=20`
- [x] 응답: `ArticleCursorResponse`
- [x] 구현 위치: `src/services/api/articles.ts`

### PUT /api/articles/{articleId}
- [x] 엔드포인트: `/api/articles/{articleId}`
- [x] 메서드: PUT
- [x] 작성자만 가능, JWT 인증 필요
- [x] 요청 본문: `{title, content}`
- [x] 응답: `ArticleResponse`
- [x] 구현 위치: `src/services/api/articles.ts`

### DELETE /api/articles/{articleId}
- [x] 엔드포인트: `/api/articles/{articleId}`
- [x] 메서드: DELETE
- [x] 작성자만 가능, JWT 인증 필요
- [x] 응답: 204 No Content
- [x] 구현 위치: `src/services/api/articles.ts`

---

## ✅ Tags API

### PUT /api/articles/{articleId}/tags
- [x] 엔드포인트: `/api/articles/{articleId}/tags`
- [x] 메서드: PUT
- [x] 작성자만 가능, JWT 인증 필요
- [x] 요청 본문: `{tags: string[]}` (전체 교체)
- [x] 응답: `TagResponse[]`
- [x] 구현 위치: `src/services/api/tags.ts`

### GET /api/articles/{articleId}/tags
- [x] 엔드포인트: `/api/articles/{articleId}/tags`
- [x] 메서드: GET
- [x] 공개 엔드포인트
- [x] 응답: `TagResponse[]`
- [x] 구현 위치: `src/services/api/tags.ts`

### GET /api/tags
- [x] 엔드포인트: `/api/tags`
- [x] 메서드: GET
- [x] 공개 엔드포인트
- [x] 쿼리 파라미터: `query` (required), `size=10`
- [x] 응답: `TagResponse[]` (자동완성/검색)
- [x] 구현 위치: `src/services/api/tags.ts`

---

## ✅ Comments API

### POST /api/articles/{articleId}/comments
- [x] 엔드포인트: `/api/articles/{articleId}/comments`
- [x] 메서드: POST
- [x] JWT 인증 필요
- [x] 요청 본문: `{content, parentId?}`
- [x] 응답: `CommentResponse`
- [x] 구현 위치: `src/services/api/comments.ts`

### GET /api/articles/{articleId}/comments
- [x] 엔드포인트: `/api/articles/{articleId}/comments`
- [x] 메서드: GET
- [x] 공개 엔드포인트
- [x] 응답: `CommentResponse[]` (path 순서 정렬)
- [x] 구현 위치: `src/services/api/comments.ts`

### PUT /api/articles/{articleId}/comments/{commentId}
- [x] 엔드포인트: `/api/articles/{articleId}/comments/{commentId}`
- [x] 메서드: PUT
- [x] 작성자만 가능, 삭제되지 않은 댓글만, JWT 인증 필요
- [x] 요청 본문: `{content}`
- [x] 응답: `CommentResponse`
- [x] 구현 위치: `src/services/api/comments.ts`

### DELETE /api/articles/{articleId}/comments/{commentId}
- [x] 엔드포인트: `/api/articles/{articleId}/comments/{commentId}`
- [x] 메서드: DELETE
- [x] 작성자만 가능, JWT 인증 필요
- [x] 응답: 204 No Content
- [x] 로직: 자식 있으면 soft delete, 자식 없으면 삭제, 고아된 부모가 soft 상태면 재귀 삭제
- [x] 구현 위치: `src/services/api/comments.ts`

---

## ✅ Likes API

### POST /api/articles/{articleId}/like
- [x] 엔드포인트: `/api/articles/{articleId}/like`
- [x] 메서드: POST
- [x] JWT 인증 필요
- [x] 응답: `LikeResponse` (토글)
- [x] 구현 위치: `src/services/api/likes.ts`

### POST /api/comments/{commentId}/like
- [x] 엔드포인트: `/api/comments/{commentId}/like`
- [x] 메서드: POST
- [x] JWT 인증 필요
- [x] 응답: `LikeResponse` (토글)
- [x] 구현 위치: `src/services/api/likes.ts`

### GET /api/articles/{articleId}/like/count
- [x] 엔드포인트: `/api/articles/{articleId}/like/count`
- [x] 메서드: GET
- [x] 공개 엔드포인트
- [x] 응답: `number`
- [x] 구현 위치: `src/services/api/likes.ts`

### GET /api/comments/{commentId}/like/count
- [x] 엔드포인트: `/api/comments/{commentId}/like/count`
- [x] 메서드: GET
- [x] 공개 엔드포인트
- [x] 응답: `number`
- [x] 구현 위치: `src/services/api/likes.ts`

---

## 📋 공통 사항

### 인증 헤더
- [x] Authorization: Bearer {accessToken} (로그인/refresh 제외)
- [x] 자동 토큰 갱신 로직 구현됨
- [x] 401 에러 시 refresh token으로 자동 갱신 시도

### 응답 컨벤션
- [x] 200 OK 처리
- [x] 201 Created 처리
- [x] 204 No Content 처리
- [x] ErrorResponse (JSON) 에러 처리

### 커서 페이지네이션
- [x] lastId (optional) 파라미터
- [x] size (default 20) 파라미터
- [x] 응답에 nextCursor, hasNext 포함

### 타입 정의
- [x] ArticleResponse
- [x] ArticleListResponse
- [x] ArticleCursorResponse
- [x] CommentResponse
- [x] LikeResponse
- [x] TagResponse
- [x] 모든 Request 타입 정의됨

---

## ⚠️ 확인 필요 사항

1. **Swagger 명세서와 실제 엔드포인트 경로 확인**
   - 현재: `/auth/*`, `/api/*`
   - Swagger에서 확인 필요

2. **응답 본문 구조 확인**
   - Swagger에서 실제 응답 스키마 확인
   - 현재 타입 정의가 정확한지 확인

3. **에러 응답 형식 확인**
   - ErrorResponse 구조가 Swagger와 일치하는지 확인

4. **CORS 설정 확인**
   - Authorization 헤더가 expose되는지 확인
   - Access-Control-Expose-Headers 설정 확인

---

## 📝 다음 단계

1. Swagger UI에서 각 엔드포인트 테스트
2. 실제 응답 구조와 타입 정의 비교
3. 에러 케이스 테스트
4. CORS 설정 확인 및 수정

