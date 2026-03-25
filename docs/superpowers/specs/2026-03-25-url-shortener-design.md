# qqwe.kr URL Shortener - MVP Design

## Overview

qqwe.kr 도메인을 사용하는 URL 단축 서비스 MVP. 로그인 없이 누구나 URL을 단축할 수 있으며, 상세 클릭 통계를 제공한다. 작동 확인 후 수익모델을 추가할 예정.

## Architecture

Next.js App Router 풀스택 모놀리스. Railway에서 단일 인스턴스로 운영한다. 리다이렉트는 middleware에서 처리하고 통계는 Next.js 15의 `after()` API로 비동기 기록한다.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Turso 데이터베이스 URL |
| `TURSO_AUTH_TOKEN` | Turso 인증 토큰 |
| `BASE_URL` | 서비스 기본 URL (e.g., `https://qqwe.kr`) |

```
사용자 → qqwe.kr (Next.js on Railway)
              ├── /                    홈페이지 (URL 입력 폼)
              ├── middleware.ts         리다이렉트 + 비동기 통계 기록
              ├── /api/shorten         URL 단축 API
              ├── /api/stats/[slug]    통계 조회 API
              └── /[slug]/stats        통계 페이지
```

## Tech Stack

| Role | Choice |
|------|--------|
| Framework | Next.js 15 (App Router) |
| Database | Turso (libSQL) |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS |
| Charts | Recharts |
| ID Generation | nanoid (6 chars) |
| UA Parsing | ua-parser-js |
| Testing | Vitest |
| Deploy | Railway |

## Data Flow

### URL Shortening

1. 홈페이지에서 URL 입력 → `POST /api/shorten`
2. URL 유효성 검증 (형식 + http/https 프로토콜만 허용, 최대 2048자)
3. nanoid로 6자리 랜덤 코드 생성 (a-zA-Z0-9, 약 568억 조합)
4. 예약 경로와 충돌 검사 (`api`, `_next`, `favicon.ico` 등)
5. Turso에 저장 → 단축 URL 반환
6. slug 충돌 시 재생성 (최대 3회, 실패 시 에러 로깅 + 500 반환)
7. 동일 URL 재요청 시 새로운 slug를 생성한다 (1:N 관계 허용)

### Redirect

1. `qqwe.kr/abc123` 요청 도착
2. `middleware.ts`에서 경로 판별: 단일 세그먼트 경로(`/xxx`)이고 예약 경로(`/api/*`, `/_next/*`, `/favicon.ico`, `/[slug]/stats`)가 아닌 경우에만 slug로 처리
3. Turso에서 slug로 원본 URL 조회
4. 원본 URL 존재 → 302 리다이렉트 즉시 반환 (302를 사용하는 이유: 301은 브라우저가 캐싱하여 이후 방문이 서버를 거치지 않아 통계 수집 불가)
5. Next.js 15 `after()` API로 통계를 비동기 기록 (리다이렉트 응답 이후 실행되어 속도에 영향 없음)
6. 원본 URL 없음 → Next.js로 통과 (404 페이지)

### Analytics Data Collection

리다이렉트 시 비동기로 수집하는 항목:
- 클릭 시각 (UTC로 저장, 프론트엔드에서 사용자 로컬 타임존으로 표시)
- Referer 헤더
- 국가: best-effort. Railway/Cloudflare 프록시가 주입하는 geo 헤더 사용, 없으면 null 저장. MVP에서는 외부 IP geolocation API 미사용
- 디바이스 종류 (desktop/mobile/tablet)
- 브라우저, OS (ua-parser-js로 User-Agent 파싱)

## API Contracts

### POST /api/shorten

Request:
```json
{ "url": "https://example.com/very-long-path" }
```

Success (200):
```json
{
  "shortUrl": "https://qqwe.kr/abc123",
  "slug": "abc123"
}
```

Errors: 400 (invalid URL), 429 (rate limited), 500 (server error)

### GET /api/stats/[slug]

Query params: `?period=7d` or `?period=30d` (default: 7d)

Success (200):
```json
{
  "slug": "abc123",
  "url": "https://example.com/very-long-path",
  "totalClicks": 142,
  "createdAt": "2026-03-25T12:00:00Z",
  "clicksByDate": [
    { "date": "2026-03-24", "clicks": 32 },
    { "date": "2026-03-25", "clicks": 15 }
  ],
  "topReferers": [
    { "referer": "https://twitter.com", "clicks": 45 },
    { "referer": "(direct)", "clicks": 30 }
  ],
  "countries": [
    { "country": "KR", "clicks": 80 },
    { "country": "US", "clicks": 40 }
  ],
  "devices": [
    { "device": "mobile", "clicks": 90 },
    { "device": "desktop", "clicks": 52 }
  ],
  "browsers": [
    { "browser": "Chrome", "clicks": 100 }
  ],
  "os": [
    { "os": "iOS", "clicks": 60 }
  ]
}
```

Errors: 404 (unknown slug)

### CORS

Same-origin만 허용. `/api/*` 엔드포인트에 CORS 헤더 미설정 (브라우저에서 qqwe.kr 프론트엔드를 통해서만 접근).

## Database Schema

```sql
CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER NOT NULL REFERENCES links(id),
  clicked_at TEXT DEFAULT (datetime('now')),
  referer TEXT,
  country TEXT,
  device TEXT,
  browser TEXT,
  os TEXT
);

CREATE INDEX idx_links_slug ON links(slug);
CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at);
```

## Pages

### Homepage (`/`)

- 중앙 정렬 URL 입력 폼 + "단축하기" 버튼
- 결과: 단축 URL + 복사 버튼 + "통계 보기" 링크 (인라인 표시)
- 하단: 최근 단축된 URL 목록 제거 (프라이버시 리스크 — 비공개 링크 노출 가능). 향후 인증 추가 시 개인 대시보드에서 제공

### Stats Page (`/[slug]/stats`)

- 원본 URL 표시
- 총 클릭수
- 시간대별 클릭 차트 (최근 7일/30일 토글)
- 리퍼러 Top 10
- 국가별 분포
- 디바이스/브라우저/OS 비율 (파이 차트)
- 차트 라이브러리: Recharts

### 404 Page

- "이 링크는 존재하지 않습니다" + 홈으로 안내 링크

### Design Direction

- 미니멀, 깔끔한 디자인 (Tailwind CSS)
- 모바일 반응형
- 다크모드는 MVP에서 제외

## Security

- **Rate Limiting**: IP 기반, 분당 10회 단축 요청 제한. 고정 윈도우 방식, in-memory Map 사용. 단일 인스턴스 운영 전제 (스케일아웃 시 Redis 등으로 교체 필요)
- **URL Validation**: URL 형식 검증 + http/https 프로토콜만 허용 + 최대 2048자
- **Malicious URL**: MVP에서는 기본 검증만. Safe Browsing API는 수익모델 단계에서 추가
- **SQL Injection**: Drizzle ORM 파라미터 바인딩으로 방지
- **Slug Collision**: unique 제약 + 충돌 시 재생성 (최대 3회)

## Error Handling

| Scenario | Response |
|----------|----------|
| Invalid URL | 400 + "올바른 URL을 입력해주세요" |
| Slug collision 3x | 500 + "잠시 후 다시 시도해주세요" |
| DB connection failure | 500 + error logging |
| Unknown slug | 404 page |
| Rate limit exceeded | 429 + "요청이 너무 많습니다" |

## Testing Strategy

- **Unit tests** (Vitest): slug 생성, URL 유효성 검증, UA 파싱 로직
- **API tests** (Vitest): `/api/shorten`, `/api/stats/[slug]` 엔드포인트
- **E2E**: MVP에서 제외, 수동 테스트로 대체

## Future (Post-MVP)

- 사용자 인증 + URL 관리 대시보드
- 커스텀 slug 지정
- Google Safe Browsing API 연동
- 다크모드
- 수익모델 (광고, 프리미엄 플랜 등)
