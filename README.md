# 99i.kr

`99i.kr`는 긴 주소를 짧은 링크로 변환하고, 실제 클릭 이후의 유입 데이터를 가볍게 확인할 수 있는 URL 단축 서비스입니다. 로그인 없이 바로 사용할 수 있고, 생성된 링크는 `99i.kr/Ab12Cd` 형태의 짧은 slug로 발급됩니다.

운영 도메인: [https://99i.kr](https://99i.kr)

## 프로젝트 개요

- URL을 입력하면 6자리 랜덤 slug를 생성해 짧은 링크를 발급합니다.
- 짧은 링크가 실제로 열릴 때 302 리디렉션을 수행하고 클릭 데이터를 비동기로 기록합니다.
- 각 링크마다 별도의 통계 페이지를 제공해 최근 7일 또는 30일 기준 유입 현황을 확인할 수 있습니다.
- `/admin`에서 Google OAuth 인증 후 전체 링크와 누적 클릭 현황을 일괄 확인할 수 있습니다.
- admin은 잘못 생성된 링크와 해당 클릭 기록을 삭제할 수 있습니다.
- 인증 없이 누구나 사용할 수 있는 MVP 구조를 유지하면서도, 기본적인 rate limit과 예약 경로 보호, 선택적 Cloudflare Turnstile 검증을 적용했습니다.
- 홈페이지에는 `robots.txt`, `sitemap.xml`, Open Graph metadata와 공유 이미지를 제공해 검색엔진 노출과 링크 미리보기를 보강했습니다.

## 주요 기능

### 1. 즉시 URL 단축

- `POST /api/shorten`으로 원본 URL을 받아 짧은 링크를 생성합니다.
- `http`와 `https` 프로토콜만 허용합니다.
- URL 길이는 최대 2048자로 제한합니다.
- 동일한 원본 URL을 다시 넣어도 기존 링크를 재사용하지 않고 새 slug를 생성합니다.
- Turnstile이 활성화된 경우 생성 요청 전에 human verification을 통과해야 합니다.

### 2. 리디렉션 기반 클릭 집계

- `99i.kr/{slug}` 요청 시 원본 URL을 조회한 뒤 `302`로 리디렉션합니다.
- 브라우저가 영구 캐싱하지 않도록 `301` 대신 `302`를 사용합니다.
- 리디렉션 응답 이후 `after()` 훅에서 클릭 로그를 비동기로 저장해 체감 속도를 유지합니다.

### 3. 링크별 통계 페이지

- `/{slug}/stats` 페이지에서 링크별 클릭 데이터를 확인할 수 있습니다.
- 최근 7일, 30일 기준으로 집계 기간을 전환할 수 있습니다.
- 총 클릭 수, 국가 수, 리퍼러 수를 요약 카드로 보여줍니다.
- 일별 클릭 차트와 국가/디바이스/브라우저/OS 분포를 시각화합니다.

### 4. Admin Dashboard

- `/admin` 진입 시 별도 로그인 버튼 없이 Google OAuth sign-in을 시작합니다.
- `ADMIN_EMAILS`에 명시적으로 등록된 계정만 admin 접근이 가능합니다.
- 전체 링크 목록, 총 클릭 수, 최근 7일 링크 생성 수, 최근 7일 클릭 수를 한 화면에서 확인할 수 있습니다.
- 각 링크에서 개별 `/{slug}/stats` 상세 페이지로 바로 이동할 수 있습니다.
- 삭제 확인 후 링크와 해당 클릭 기록을 함께 제거할 수 있습니다.

### 5. 기본 보안 장치

- IP 기준 분당 10회 생성 제한으로 과도한 요청을 막습니다.
- `api`, `admin`, `_next`, `favicon.ico`, `robots.txt`, `sitemap.xml` 같은 예약 경로와 slug 충돌을 막습니다.
- Turnstile 환경 변수가 설정되면 `/api/shorten`에서 Cloudflare Siteverify를 호출해 verification을 강제합니다.
- Drizzle ORM을 통해 쿼리를 구성해 SQL injection 위험을 줄입니다.
- 보안 헤더(HSTS, X-Frame-Options, COOP, Referrer-Policy 등)를 기본 적용합니다.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4 |
| 데이터베이스 | PostgreSQL 17 |
| ORM | Drizzle ORM |
| 차트 | Recharts |
| slug 생성 | nanoid |
| User-Agent 분석 | ua-parser-js |
| 인증 | Auth.js (`next-auth` beta), Google OAuth |
| 보안/검증 | Cloudflare Turnstile (optional), security headers |
| 테스트 | Vitest |
| 런타임 | Node.js standalone server |
| 운영 | Docker Compose + Caddy + Cloudflare DNS |

## 운영 아키텍처

현재 운영 배포는 Vultr 서버에서 Docker Compose와 Caddy를 사용합니다.

- 앱 compose 프로젝트: `99i-kr-url-short`
- 앱 compose 파일: `compose.yml`
- 앱 컨테이너: `i99-kr-app`
- DB 컨테이너: `i99-kr-db`
- 앱 이미지는 `99i-kr-url-short-app:latest`
- Caddy는 `99i.kr -> i99-kr-app:3000` 으로 reverse proxy 합니다.
- 운영 compose는 외부 network `i99-kr_default` 에 앱 컨테이너를 연결해 gateway Caddy와 통신합니다.

관련 파일:

- 배포 compose: [compose.yml](/Users/sungwoonjeon/dev/99i-kr-url-short/compose.yml:1)
- 로컬/범용 compose: [docker-compose.yml](/Users/sungwoonjeon/dev/99i-kr-url-short/docker-compose.yml:1)
- 운영 Caddy 템플릿: [ops/vultr/99i-kr.caddy](/Users/sungwoonjeon/dev/99i-kr-url-short/ops/vultr/99i-kr.caddy:1)
- 보조 Caddy 파일: [infra/caddy/99i.kr.caddy](/Users/sungwoonjeon/dev/99i-kr-url-short/infra/caddy/99i.kr.caddy:1)
- 상세 배포 절차: [ops/vultr/DEPLOY.md](/Users/sungwoonjeon/dev/99i-kr-url-short/ops/vultr/DEPLOY.md:1)

## 아키텍처

이 프로젝트는 별도 API 서버를 두지 않는 Next.js 풀스택 모놀리스입니다.

1. 홈페이지에서 URL 입력
2. `/api/shorten`이 URL을 검증하고 slug 생성
3. PostgreSQL에 원본 URL 저장
4. 생성된 링크를 사용자에게 반환
5. 짧은 링크 요청 시 `src/app/[slug]/route.ts`에서 원본 URL 조회
6. `302` 리디렉션 응답 반환
7. 응답 이후 클릭 메타데이터를 비동기로 저장
8. `/{slug}/stats` 또는 `/api/stats/[slug]`에서 통계 집계 조회
9. `/admin`에서 Google OAuth 인증 후 전체 링크/클릭 현황 조회 및 삭제

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
  "url": "https://example.com/very-long-url",
  "turnstileToken": "required-only-when-turnstile-is-enabled"
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
- `403` Turnstile 검증 실패
- `429` 생성 요청 과다
- `500` slug 생성 실패 또는 서버 오류

### `GET /api/stats/[slug]?period=7d`

`period`는 `7d` 또는 `30d`를 받습니다.

## 환경 변수

기본 템플릿은 [.env.example](/Users/sungwoonjeon/dev/99i-kr-url-short/.env.example:1) 를 사용합니다.

주요 값:

```env
DATABASE_URL=postgresql://99i:change-me@db:5432/99i_kr
DB_NAME=99i_kr
DB_USER=99i
DB_PASSWORD=change-me
BASE_URL=https://99i.kr
AUTH_URL=https://99i.kr
AUTH_SECRET=replace-with-a-random-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
ADMIN_EMAILS=admin1@example.com,admin2@example.com
NEXT_PUBLIC_SITE_DOMAIN=99i.kr
NEXT_PUBLIC_SITE_NAME=99i.kr
NEXT_PUBLIC_SITE_TITLE=99i.kr - URL 단축 서비스
NEXT_PUBLIC_SITE_DESCRIPTION=긴 URL을 짧게 줄이고 클릭 통계를 확인하세요
NEXT_PUBLIC_SITE_TAGLINE=URL을 짧게 줄이세요
TURNSTILE_ENABLED=true
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_EXPECTED_HOSTNAME=99i.kr
TURNSTILE_SECRET_KEY=your-secret-key
```

메모:

- `DATABASE_URL`은 앱 runtime에서 사용하는 Postgres 연결 문자열입니다.
- `DB_*` 값은 Docker Compose의 Postgres 초기화에 사용합니다.
- `AUTH_URL`은 Google OAuth callback URL 계산 기준입니다.
- `AUTH_SECRET`은 Auth.js 세션 암호화 키입니다.
- `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`은 Google OAuth 클라이언트 자격 증명입니다.
- 기존 키 이름인 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`도 호환됩니다.
- `TURNSTILE_ENABLED=false`면 Turnstile을 비활성화할 수 있습니다.
- `TURNSTILE_EXPECTED_HOSTNAME`은 Turnstile hostname 검증 기준입니다.
- 로컬에서 Turnstile을 검증할 때는 Cloudflare test key를 쓰거나 Cloudflare Hostname Management에 `localhost`를 추가해야 합니다. 운영 sitekey는 `99i.kr`만 허용하는 구성이 권장됩니다.

Google OAuth redirect URI:

- 로컬: `http://localhost:3000/api/auth/callback/google`
- 운영: `https://99i.kr/api/auth/callback/google`

## 로컬 실행

### 1. 환경 변수 준비

- Next.js 직접 실행: `.env.example` 을 `.env.local` 로 복사
- Docker Compose 실행: `.env.example` 을 `.env` 로 복사

### 2. 의존성 설치

```bash
npm install
```

### 3. Docker Compose로 Postgres 실행

```bash
docker compose -f docker-compose.yml up -d db
docker compose -f docker-compose.yml --profile migration run --rm migrator
```

### 4. 개발 서버 실행

```bash
npm run dev
```

기본 주소는 `http://localhost:3000`입니다.

## 데이터베이스 반영

Drizzle 설정은 [drizzle.config.ts](/Users/sungwoonjeon/dev/99i-kr-url-short/drizzle.config.ts:1) 에 있으며, PostgreSQL을 대상으로 사용합니다.

```bash
npm run db:generate
npm run db:push
npm run db:init
```

## Vultr 배포 메모

- 실제 운영 compose는 [compose.yml](/Users/sungwoonjeon/dev/99i-kr-url-short/compose.yml:1) 기준입니다.
- 운영 env 파일명은 `.env.production` 입니다.
- `compose.yml` 실행 시에는 반드시 `docker compose --env-file .env.production -f compose.yml ...` 형식을 사용해야 `${DB_*}` 값이 정상 치환됩니다.
- Caddy가 연결할 수 있도록 앱 컨테이너는 외부 network `i99-kr_default` 에 붙어야 합니다.
- Caddy site config는 `99i.kr -> i99-kr-app:3000` 을 유지해야 합니다.
- 반복 배포는 [ops/vultr/deploy.sh](/Users/sungwoonjeon/dev/99i-kr-url-short/ops/vultr/deploy.sh:1) 로 실행할 수 있습니다.
- 배포 전후 절차는 [ops/vultr/DEPLOY.md](/Users/sungwoonjeon/dev/99i-kr-url-short/ops/vultr/DEPLOY.md:1) 를 따릅니다.

## 테스트

```bash
npm run lint
npm run test:run
npm run build
```

현재 테스트 범위:

- URL 유효성 검증
- slug 생성 및 예약 경로 처리
- rate limit 로직
- public base URL 계산
- User-Agent / geo 헤더 파싱
- Turnstile env / verification helpers
- admin auth env / allowlist helpers
