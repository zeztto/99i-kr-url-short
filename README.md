# 99i.kr

`99i.kr`는 긴 주소를 짧은 링크로 변환하고, 실제 클릭 이후의 유입 데이터를 가볍게 확인할 수 있는 URL 단축 서비스입니다. 로그인 없이 바로 사용할 수 있고, 생성된 링크는 `99i.kr/Ab12Cd` 형태의 짧은 slug로 발급됩니다.

운영 도메인: [https://99i.kr](https://99i.kr)

> 현재 GitHub 레포 이름은 기존 히스토리 보존을 위해 `qqwe.kr-url-short`를 유지하고 있으며, 서비스 브랜드는 `99i.kr`로 리브랜딩 중입니다.

## 프로젝트 개요

- URL을 입력하면 6자리 랜덤 slug를 생성해 짧은 링크를 발급합니다.
- 짧은 링크가 실제로 열릴 때 302 리디렉션을 수행하고 클릭 데이터를 비동기로 기록합니다.
- 각 링크마다 별도의 통계 페이지를 제공해 최근 7일 또는 30일 기준 유입 현황을 확인할 수 있습니다.
- 인증 없이 누구나 사용할 수 있는 MVP 구조를 유지하면서도, 기본적인 rate limit과 예약 경로 보호를 적용했습니다.

## 주요 기능

### 1. 즉시 URL 단축

- `POST /api/shorten`으로 원본 URL을 받아 짧은 링크를 생성합니다.
- `http`와 `https` 프로토콜만 허용합니다.
- URL 길이는 최대 2048자로 제한합니다.
- 동일한 원본 URL을 다시 넣어도 기존 링크를 재사용하지 않고 새 slug를 생성합니다.

### 2. 리디렉션 기반 클릭 집계

- `99i.kr/{slug}` 요청 시 원본 URL을 조회한 뒤 `302`로 리디렉션합니다.
- 브라우저가 영구 캐싱하지 않도록 `301` 대신 `302`를 사용합니다.
- 리디렉션 응답 이후 `after()` 훅에서 클릭 로그를 비동기로 저장해 체감 속도를 유지합니다.

### 3. 링크별 통계 페이지

- `/{slug}/stats` 페이지에서 링크별 클릭 데이터를 확인할 수 있습니다.
- 최근 7일, 30일 기준으로 집계 기간을 전환할 수 있습니다.
- 총 클릭 수, 국가 수, 리퍼러 수를 요약 카드로 보여줍니다.
- 일별 클릭 차트와 국가/디바이스/브라우저/OS 분포를 시각화합니다.

### 4. 기본 보안 장치

- IP 기준 분당 10회 생성 제한으로 과도한 요청을 막습니다.
- `api`, `_next`, `favicon.ico`, `robots.txt`, `sitemap.xml` 같은 예약 경로와 slug 충돌을 막습니다.
- Drizzle ORM을 통해 쿼리를 구성해 SQL injection 위험을 줄입니다.
- 보안 헤더(HSTS, X-Frame-Options, COOP, Referrer-Policy 등)를 기본 적용합니다.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4 |
| 데이터베이스 | Turso (libSQL) |
| ORM | Drizzle ORM |
| 차트 | Recharts |
| slug 생성 | nanoid |
| User-Agent 분석 | ua-parser-js |
| 테스트 | Vitest |
| 런타임 | Node.js |
| 운영 | Railway + Cloudflare |

## 아키텍처

이 프로젝트는 별도 API 서버를 두지 않는 Next.js 풀스택 모놀리스입니다.

1. 홈페이지에서 URL 입력
2. `/api/shorten`이 URL을 검증하고 slug 생성
3. Turso에 원본 URL 저장
4. 생성된 링크를 사용자에게 반환
5. 짧은 링크 요청 시 `src/app/[slug]/route.ts`에서 원본 URL 조회
6. `302` 리디렉션 응답 반환
7. 응답 이후 클릭 메타데이터를 비동기로 저장
8. `/{slug}/stats` 또는 `/api/stats/[slug]`에서 통계 집계 조회

## 데이터 모델

### `links`

| 컬럼 | 설명 |
| --- | --- |
| `id` | 자동 증가 기본 키 |
| `slug` | 고유한 6자리 단축 코드 |
| `url` | 원본 URL |
| `created_at` | 생성 시각 |

### `clicks`

| 컬럼 | 설명 |
| --- | --- |
| `id` | 자동 증가 기본 키 |
| `link_id` | `links.id` 참조 |
| `clicked_at` | 클릭 시각 |
| `referer` | 유입 경로 |
| `country` | 국가 코드 |
| `device` | desktop / mobile / tablet |
| `browser` | 브라우저 이름 |
| `os` | 운영체제 이름 |

## API

### `POST /api/shorten`

요청:

```json
{
  "url": "https://example.com/very-long-url"
}
```

응답:

```json
{
  "shortUrl": "https://99i.kr/Ab12Cd",
  "slug": "Ab12Cd"
}
```

에러:

- `400` 잘못된 URL
- `429` 생성 요청 과다
- `500` slug 생성 실패 또는 서버 오류

### `GET /api/stats/[slug]?period=7d`

`period`는 `7d` 또는 `30d`를 받습니다.

응답 예시:

```json
{
  "slug": "Ab12Cd",
  "url": "https://example.com/very-long-url",
  "totalClicks": 142,
  "uniqueCountries": 5,
  "uniqueReferers": 12,
  "clicksByDate": [
    { "date": "2026-03-20", "clicks": 14 },
    { "date": "2026-03-21", "clicks": 19 }
  ],
  "topReferers": [
    { "referer": "https://twitter.com", "clicks": 45 },
    { "referer": "(direct)", "clicks": 30 }
  ]
}
```

## 로컬 실행

### 1. 환경 변수

프로젝트 루트에서 `.env.example`을 `.env.local`로 복사한 뒤 아래 값을 환경에 맞게 수정합니다.

```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_DOMAIN=99i.kr
NEXT_PUBLIC_SITE_NAME=99i.kr
NEXT_PUBLIC_SITE_TITLE=99i.kr - URL 단축 서비스
NEXT_PUBLIC_SITE_DESCRIPTION=긴 URL을 짧게 줄이고 클릭 통계를 확인하세요
NEXT_PUBLIC_SITE_TAGLINE=URL을 짧게 줄이세요
```

`BASE_URL`은 단축 URL 응답 본문에 들어갈 서비스 기준 주소입니다. `NEXT_PUBLIC_SITE_*` 값은 화면과 metadata에 표시될 도메인/브랜드를 제어합니다.

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

기본 주소는 `http://localhost:3000`입니다.

## 데이터베이스 반영

Drizzle 설정은 `drizzle.config.ts`에 있으며, Turso를 직접 대상으로 사용합니다.

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

로컬에서 Turso 연결 정보가 없으면 `src/lib/db/index.ts`의 fallback에 따라 `file:local.db`를 사용할 수 있지만, 실제 운영 동작을 확인하려면 Turso 연결을 권장합니다.

## 테스트

```bash
npm run lint
npm run test:run
npm run build
```

현재 포함된 테스트 범위:

- URL 유효성 검증
- slug 생성 및 예약 경로 처리
- rate limit 로직
- public base URL 계산
- User-Agent / geo 헤더 파싱

## 디렉터리 구조

```text
src/
  app/
    page.tsx
    [slug]/route.ts
    [slug]/stats/page.tsx
    api/shorten/route.ts
    api/stats/[slug]/route.ts
  lib/
    analytics.ts
    public-url.ts
    rate-limit.ts
    slug.ts
    stats.ts
    url.ts
    db/
      index.ts
      schema.ts
tests/
  lib/
```

## 구현 포인트

- 링크 생성과 통계 조회를 하나의 Next.js 앱 안에서 처리합니다.
- `resolvePublicBaseUrl()`로 프록시 환경에서도 올바른 공개 도메인을 계산합니다.
- `parseClickData()`는 Cloudflare, Vercel 등 프록시가 넣어주는 geo 헤더를 우선 사용합니다.
- 통계 집계는 DB에서 최근 기간의 클릭 레코드를 읽어 메모리에서 그룹핑하는 단순한 구조로 시작했습니다.
- MVP 단계에서는 인증, 커스텀 slug, 악성 URL 차단, 사용자별 대시보드는 제외했습니다.

## 향후 확장 아이디어

- 사용자 계정 및 링크 관리 대시보드
- 커스텀 slug 지정
- 링크 만료 시점 설정
- Safe Browsing 기반 악성 URL 판별
- 팀/프로젝트 단위 링크 관리
- 광고 또는 프리미엄 요금제

## 라이선스

별도 라이선스를 명시하지 않았습니다. 필요 시 추가할 예정입니다.
