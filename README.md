# SJBoard - SJ_Board Project

React + Vite로 구현한 SJ_Board 프로젝트입니다.

## 프로젝트 구조

```
src/
├── components/          # 공통 컴포넌트
├── constants/          # 상수
├── hooks/              # 공통 훅
├── modules/            # 기능별 모듈
│   ├── home/          # 메인 페이지
│   ├── auth/          # 인증
│   ├── drop/          # 음악 드랍
│   ├── music/         # 음악 상세
│   ├── profile/       # 마이페이지
│   ├── setting/       # 설정
│   └── notification/  # 알림
├── navigation/         # 라우팅
├── services/          # API 서비스
├── store/             # 상태 관리
├── theme/             # 테마
├── types/             # 타입 정의
└── utils/             # 유틸리티
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 API 베이스 URL을 설정하세요:

```env
VITE_API_BASE_URL=http://localhost:8080
```

`.env.example` 파일을 참고하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## 환경 변수

Vite에서는 환경 변수에 `VITE_` 접두사를 붙여야 클라이언트에서 접근할 수 있습니다.

- `VITE_API_BASE_URL`: API 서버의 베이스 URL (기본값: http://localhost:8080)

## 주요 기능

- ✅ 모듈화된 프로젝트 구조
- ✅ TypeScript 지원
- ✅ API 클라이언트 (자동 토큰 갱신)
- ✅ 커서 기반 페이지네이션
- ✅ 인증 시스템 (JWT)
- ✅ 반응형 디자인

## API 연동

모든 API 서비스는 `src/services/api/`에 구현되어 있습니다.

자세한 사용법은 `src/services/api/README.md`를 참고하세요.
